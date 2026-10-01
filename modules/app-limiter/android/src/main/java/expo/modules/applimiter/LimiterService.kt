package expo.modules.applimiter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

/**
 * Foreground service that watches which app is open (via UsageStatsManager) and:
 *  - runs the focus session: counts the budget down only while a picked app is open,
 *    and brings RemindU to the front when time is up;
 *  - enforces app limits: brings up the check-in gate when a limited app is opened
 *    without an active limit session.
 */
class LimiterService : Service() {

  companion object {
    private const val TAG = "RemindULimiter"
    private const val CHANNEL_ID = "remindu_limiter"
    private const val NOTIF_ID = 4201
    private const val ACTIVE_POLL_MS = 1_000L   // screen on
    private const val IDLE_POLL_MS = 5_000L     // screen off
    private const val GATE_DEBOUNCE_MS = 2_500L
    // Never count more than this per tick, so a stalled loop can't eat the budget.
    private const val MAX_TICK_MS = 5_000L

    // Must match "scheme" in app.json
    private const val SCHEME = "remindu"

    fun start(ctx: Context) {
      val i = Intent(ctx, LimiterService::class.java)
      if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
    }

    fun stop(ctx: Context) {
      ctx.stopService(Intent(ctx, LimiterService::class.java))
    }
  }

  private val handler = Handler(Looper.getMainLooper())
  private var lastForeground: String? = null
  private var lastGateAt = 0L
  private var lastSessionOpenAt = 0L
  // When the focus budget was last updated; 0 = don't count the gap (screen was off, service restarted).
  private var focusTickAt = 0L
  private var notifKey: String? = null

  private val tick = object : Runnable {
    override fun run() {
      val next = try {
        check()
      } catch (e: Exception) {
        Log.w(TAG, "tick failed", e)
        IDLE_POLL_MS
      }
      handler.postDelayed(this, next)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    notifKey = null
    // Must call startForeground before anything else, even if we're about to stop.
    startForegroundCompat(buildNotification(System.currentTimeMillis()))
    if (!LimiterStore.needsService(this)) {
      stopSelf()
      return START_NOT_STICKY
    }
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY // Android restarts us if the process is killed
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  // ---------- core loop ----------

  private fun check(): Long {
    val now = System.currentTimeMillis()
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    if (!power.isInteractive) {
      // Screen off never counts.
      focusTickAt = 0L
      LimiterStore.focusSession(this)?.let { s ->
        if (s.status == "counting") LimiterStore.saveFocus(this, s.copy(status = "paused", foreground = null))
      }
      refreshNotification(now)
      return IDLE_POLL_MS
    }

    val fg = foregroundPackage()
    LimiterStore.focusSession(this)?.let { tickFocus(it, fg, now) }
    refreshNotification(now)

    if (fg == null || fg == packageName) return ACTIVE_POLL_MS // user is inside RemindU

    val rule = LimiterStore.ruleFor(this, fg) ?: return ACTIVE_POLL_MS
    val state = LimiterStore.state(this, rule.id)

    if (state.activeUntil > now) return ACTIVE_POLL_MS // session running, let them use it

    // No active session -> send them to the check-in screen
    if (now - lastGateAt > GATE_DEBOUNCE_MS) {
      lastGateAt = now
      val reason = when {
        state.used >= rule.sessionsPerDay -> "limit"
        state.activeUntil > 0 -> "time_up"
        else -> "start"
      }
      openGate(rule.id, fg, reason)
    }
    return ACTIVE_POLL_MS
  }

  /** Counts the focus budget down while a picked app is open; opens RemindU when it runs out. */
  private fun tickFocus(s: FocusSession, fg: String?, now: Long) {
    val distracting = fg != null && fg in s.packages
    val elapsed = if (distracting && focusTickAt > 0) (now - focusTickAt).coerceIn(0L, MAX_TICK_MS) else 0L
    focusTickAt = now

    if (s.status == "time_up") {
      // Out of budget: keep pulling them back while they stay in a picked app.
      if (distracting && now - lastSessionOpenAt > GATE_DEBOUNCE_MS) {
        lastSessionOpenAt = now
        openSession()
      }
      if (s.foreground != fg) LimiterStore.saveFocus(this, s.copy(foreground = fg))
      return
    }

    val remaining = (s.remainingMs - elapsed).coerceAtLeast(0L)
    val status = when {
      remaining == 0L -> "time_up"
      distracting -> "counting"
      else -> "paused"
    }
    if (remaining != s.remainingMs || status != s.status || fg != s.foreground) {
      LimiterStore.saveFocus(this, s.copy(remainingMs = remaining, status = status, foreground = fg))
    }
    if (status == "time_up") {
      lastSessionOpenAt = now
      openSession()
    }
  }

  /** Last app that moved to the foreground, according to usage events. */
  private fun foregroundPackage(): String? {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    // Look further back on the first run so we know what's open right now.
    val lookback = if (lastForeground == null) 10 * 60_000L else 15_000L
    val events = usm.queryEvents(now - lookback, now)
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      // MOVE_TO_FOREGROUND == ACTIVITY_RESUMED (value 1) on API 29+
      @Suppress("DEPRECATION")
      if (e.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) lastForeground = e.packageName
    }
    return lastForeground
  }

  /** Deep link into the React Native app: remindu://gate?ruleId=...&pkg=...&reason=... */
  private fun openGate(ruleId: String, pkg: String, reason: String) {
    openDeepLink("$SCHEME://gate?ruleId=${Uri.encode(ruleId)}&pkg=${Uri.encode(pkg)}&reason=$reason")
  }

  /** remindu://session — the running-session screen, which shows "Time's up". */
  private fun openSession() = openDeepLink("$SCHEME://session")

  private fun openDeepLink(url: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
      setPackage(packageName)
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_SINGLE_TOP or
          Intent.FLAG_ACTIVITY_CLEAR_TOP
      )
    }
    try {
      // Allowed from the background because the user granted "Display over other apps".
      startActivity(intent)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open $url", e)
    }
  }

  // ---------- notification ----------

  /** Re-posts the notification only when what it shows changes. */
  private fun refreshNotification(now: Long) {
    val key = notificationKey(now)
    if (key == notifKey) return
    notifKey = key
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIF_ID, buildNotification(now))
  }

  private fun notificationKey(now: Long): String {
    LimiterStore.focusSession(this)?.let { s ->
      return when (s.status) {
        // The chronometer ticks by itself; only re-post if the end time drifts.
        "counting" -> "focus:counting:${s.foreground}:${(now + s.remainingMs) / 5_000}"
        "paused" -> "focus:paused:${s.remainingMs / 60_000}"
        else -> "focus:${s.status}"
      }
    }
    return activeLimit(now)?.let { "limit:${it.first.id}:${it.second}" } ?: "idle"
  }

  /** The limit session ending soonest, if any. */
  private fun activeLimit(now: Long): Pair<LimitRule, Long>? =
    LimiterStore.rules(this)
      .filter { it.enabled }
      .map { it to LimiterStore.state(this, it.id).activeUntil }
      .filter { it.second > now }
      .minByOrNull { it.second }

  private fun buildNotification(now: Long): Notification {
    val focus = LimiterStore.focusSession(this)
    val open = if (focus != null) {
      Intent(Intent.ACTION_VIEW, Uri.parse("$SCHEME://session")).setPackage(packageName)
    } else {
      packageManager.getLaunchIntentForPackage(packageName)
    }
    val pi = PendingIntent.getActivity(
      this, 0, open,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL_ID)
    else @Suppress("DEPRECATION") Notification.Builder(this)

    // TODO: replace with a white, transparent-background notification icon (res/drawable)
    b.setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(pi)

    if (focus != null) {
      val goal = focus.goal.ifBlank { "Focus session" }
      when (focus.status) {
        "counting" -> b.setContentTitle(goal)
          .setContentText("Counting down — ${appLabel(focus.foreground)} is open")
          .setUsesChronometer(true)
          .setChronometerCountDown(true) // system ticks the countdown for us
          .setWhen(now + focus.remainingMs)
          .setShowWhen(true)
        "time_up" -> b.setContentTitle("Time's up")
          .setContentText("“$goal”")
          .setShowWhen(false)
        else -> b.setContentTitle(goal)
          .setContentText("Paused — ${formatDuration(focus.remainingMs)} left")
          .setShowWhen(false)
      }
      return b.build()
    }

    val limit = activeLimit(now)
    if (limit != null) {
      b.setContentTitle("${limit.first.name} session")
        .setContentText("Time left in this session")
        .setUsesChronometer(true)
        .setChronometerCountDown(true)
        .setWhen(limit.second)
        .setShowWhen(true)
    } else {
      b.setContentTitle("RemindU is on")
        .setContentText("We'll check in when you open a limited app")
        .setShowWhen(false)
    }
    return b.build()
  }

  private fun appLabel(pkg: String?): String {
    if (pkg == null) return "an app"
    return try {
      packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
    } catch (e: PackageManager.NameNotFoundException) {
      pkg
    }
  }

  private fun formatDuration(ms: Long): String {
    val totalMin = (ms + 59_999) / 60_000
    val h = totalMin / 60
    val m = totalMin % 60
    return if (h > 0) "${h}h ${m}m" else "${m}m"
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < 26) return
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "App sessions", NotificationManager.IMPORTANCE_LOW)
    )
  }

  private fun startForegroundCompat(n: Notification) {
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, n)
    }
  }
}
