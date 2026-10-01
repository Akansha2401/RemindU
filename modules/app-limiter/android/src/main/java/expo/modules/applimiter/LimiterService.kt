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
 * Foreground service that watches which app is open (via UsageStatsManager)
 * and brings up RemindU's check-in screen when a limited app is opened
 * without an active session, or when a session runs out.
 */
class LimiterService : Service() {

  companion object {
    private const val TAG = "RemindULimiter"
    private const val CHANNEL_ID = "remindu_limiter"
    private const val NOTIF_ID = 4201
    private const val ACTIVE_POLL_MS = 1_000L   // screen on
    private const val IDLE_POLL_MS = 5_000L     // screen off
    private const val GATE_DEBOUNCE_MS = 2_500L

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
    startForegroundCompat(buildNotification(null, 0L))
    notifKey = "idle"
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
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    if (!power.isInteractive) return IDLE_POLL_MS

    val now = System.currentTimeMillis()
    refreshNotification(now)

    val fg = foregroundPackage() ?: return ACTIVE_POLL_MS
    if (fg == packageName) return ACTIVE_POLL_MS // user is inside RemindU

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
    val uri = Uri.parse(
      "$SCHEME://gate?ruleId=${Uri.encode(ruleId)}&pkg=${Uri.encode(pkg)}&reason=$reason"
    )
    val intent = Intent(Intent.ACTION_VIEW, uri).apply {
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
      Log.w(TAG, "Could not open gate", e)
    }
  }

  // ---------- notification ----------

  /** Shows a live countdown while any session is running, otherwise a quiet status. */
  private fun refreshNotification(now: Long) {
    val active = LimiterStore.rules(this)
      .filter { it.enabled }
      .map { it to LimiterStore.state(this, it.id) }
      .filter { it.second.activeUntil > now }
      .minByOrNull { it.second.activeUntil }

    val key = active?.let { "${it.first.id}:${it.second.activeUntil}" } ?: "idle"
    if (key == notifKey) return
    notifKey = key
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIF_ID, buildNotification(active?.first, active?.second?.activeUntil ?: 0L))
  }

  private fun buildNotification(rule: LimitRule?, until: Long): Notification {
    val open = packageManager.getLaunchIntentForPackage(packageName)
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

    if (rule != null && until > 0) {
      b.setContentTitle("${rule.name} session")
        .setContentText("Time left in this session")
        .setUsesChronometer(true)
        .setChronometerCountDown(true) // system ticks the countdown for us
        .setWhen(until)
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
