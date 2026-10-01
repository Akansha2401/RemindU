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
 *  - runs the per-app sessions: each timer waits until its app is opened, counts down only
 *    while that app is open, logs when it was used, and brings RemindU to the front at zero;
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
  // When the session timers were last updated; 0 = don't count the gap (screen was off, service restarted).
  private var sessionTickAt = 0L
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
      sessionTickAt = 0L
      val list = LimiterStore.sessions(this)
      if (list.any { it.status == "counting" }) {
        LimiterStore.saveSessions(this, list.map { if (it.status == "counting") it.copy(status = "paused") else it })
      }
      refreshNotification(now)
      return IDLE_POLL_MS
    }

    val fg = foregroundPackage()
    tickSessions(fg, now)
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

  /**
   * Updates every app timer: the one whose app is open counts down (and starts, the first time);
   * the rest wait or pause. Opens RemindU when a timer hits zero.
   */
  private fun tickSessions(fg: String?, now: Long) {
    val list = LimiterStore.sessions(this)
    val elapsed = if (sessionTickAt > 0) (now - sessionTickAt).coerceIn(0L, MAX_TICK_MS) else 0L
    val from = if (sessionTickAt > 0) now - elapsed else now
    sessionTickAt = now
    if (list.isEmpty()) return

    var timeUp: AppSession? = null
    val next = list.map { s ->
      val open = fg == s.pkg
      if (!open) {
        val idle = if (s.startedAt == 0L) "waiting" else "paused"
        return@map if (s.status == "counting") s.copy(status = idle) else s
      }
      val used = LimiterStore.withUsage(s, from, now, MAX_TICK_MS + ACTIVE_POLL_MS)
      if (s.status == "time_up") {
        // Out of time: keep pulling them back while they stay in the app.
        if (now - lastSessionOpenAt > GATE_DEBOUNCE_MS) timeUp = s
        return@map used
      }
      val remaining = (s.remainingMs - elapsed).coerceAtLeast(0L)
      val status = if (remaining == 0L) "time_up" else "counting"
      if (status == "time_up") timeUp = s
      used.copy(
        remainingMs = remaining,
        status = status,
        startedAt = if (s.startedAt == 0L) now else s.startedAt,
      )
    }
    if (next != list) LimiterStore.saveSessions(this, next)
    timeUp?.let {
      lastSessionOpenAt = now
      openSession(it.id)
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

  /** remindu://session/<id> — the session screen, which shows "Time's up". */
  private fun openSession(id: String) = openDeepLink(sessionUrl(id))

  private fun sessionUrl(id: String) = "$SCHEME://session/${Uri.encode(id)}"

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
    val list = LimiterStore.sessions(this)
    if (list.isNotEmpty()) {
      val counting = list.firstOrNull { it.status == "counting" }
      val timeUp = list.firstOrNull { it.status == "time_up" }
      return when {
        // The chronometer ticks by itself; only re-post if the end time drifts.
        counting != null -> "app:counting:${counting.id}:${(now + counting.remainingMs) / 5_000}"
        timeUp != null -> "app:time_up:${timeUp.id}"
        else -> "app:idle:${list.size}"
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
    val list = LimiterStore.sessions(this)
    val counting = list.firstOrNull { it.status == "counting" }
    val timeUp = list.firstOrNull { it.status == "time_up" }
    val current = counting ?: timeUp
    val open = if (current != null) {
      Intent(Intent.ACTION_VIEW, Uri.parse(sessionUrl(current.id))).setPackage(packageName)
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

    if (list.isNotEmpty()) {
      when {
        counting != null -> b.setContentTitle("${counting.label} — counting down")
          .setContentText(counting.goal.ifBlank { "Time left in this session" })
          .setUsesChronometer(true)
          .setChronometerCountDown(true) // system ticks the countdown for us
          .setWhen(now + counting.remainingMs)
          .setShowWhen(true)
        timeUp != null -> b.setContentTitle("Time's up on ${timeUp.label}")
          .setContentText(if (timeUp.goal.isBlank()) "Tap to check in" else "“${timeUp.goal}”")
          .setShowWhen(false)
        else -> b.setContentTitle("RemindU is watching ${list.size} app${if (list.size == 1) "" else "s"}")
          .setContentText("Each timer starts when you open the app")
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
