package expo.modules.applimiter

import android.Manifest
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class AppLimiterModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AppLimiter")

    // ----- installed apps -----
    AsyncFunction("getInstalledApps") { includeIcons: Boolean -> installedApps(includeIcons) }
    AsyncFunction("getAppInfo") { pkg: String -> appInfo(pkg) }

    // ----- permissions -----
    Function("hasUsageAccess") { hasUsageAccess() }
    Function("canDrawOverlays") { Settings.canDrawOverlays(context) }
    Function("isIgnoringBatteryOptimizations") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }
    Function("openUsageAccessSettings") {
      launch(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }
    Function("openOverlaySettings") {
      launch(
        Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}")
        )
      )
    }
    Function("openBatterySettings") {
      launch(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
    }

    // ----- rules & sessions -----
    Function("setRules") { json: String -> LimiterStore.saveRules(context, json) }
    Function("getRuleState") { ruleId: String -> stateMap(ruleId) }
    Function("startSession") { ruleId: String ->
      LimiterStore.startSession(context, ruleId)?.let { stateMap(ruleId) }
    }
    Function("endSession") { ruleId: String -> LimiterStore.endSession(context, ruleId) }

    // ----- watcher on/off -----
    Function("startMonitoring") {
      LimiterStore.setMonitoring(context, true)
      LimiterService.start(context)
    }
    Function("stopMonitoring") {
      LimiterStore.setMonitoring(context, false)
      if (!LimiterStore.needsService(context)) LimiterService.stop(context)
    }
    Function("isMonitoring") { LimiterStore.isMonitoring(context) }

    // ----- per-app sessions (Add sheet -> Done) -----
    Function("addAppSessions") { json: String ->
      LimiterStore.addSessions(context, json)
      LimiterService.start(context)
    }
    Function("getAppSessions") { LimiterStore.sessions(context).map { sessionMap(it) } }
    Function("continueAppSession") { id: String, budgetSec: Double ->
      LimiterStore.continueSession(context, id, (budgetSec * 1000).toLong())?.let { sessionMap(it) }
    }
    Function("endAppSession") { id: String ->
      val ended = LimiterStore.removeSession(context, id)
      if (LimiterStore.needsService(context)) LimiterService.start(context) // refresh notification
      else LimiterService.stop(context)
      ended?.let { sessionMap(it) }
    }

    // ----- screen time (Home and Profile stats) -----
    AsyncFunction("getScreenTime") { days: Int -> screenTime(days.coerceIn(1, 30)) }

    // ----- navigation helpers for the gate screen -----
    Function("openApp") { pkg: String ->
      val intent = context.packageManager.getLaunchIntentForPackage(pkg)
      if (intent == null) {
        false
      } else {
        launch(intent)
        true
      }
    }
    Function("goHome") {
      launch(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME))
    }
  }

  // ---------- helpers ----------

  private fun launch(intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  private fun installedApps(includeIcons: Boolean): List<Map<String, Any?>> {
    val pm = context.packageManager
    val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    @Suppress("DEPRECATION")
    val activities = pm.queryIntentActivities(launcher, 0)

    return activities
      .map { it.activityInfo.applicationInfo }
      .distinctBy { it.packageName }
      .filter { it.packageName != context.packageName }
      .map { ai -> toMap(pm, ai, includeIcons) }
      .sortedBy { (it["label"] as String).lowercase() }
  }

  private fun appInfo(pkg: String): Map<String, Any?>? = try {
    val pm = context.packageManager
    toMap(pm, pm.getApplicationInfo(pkg, 0), true)
  } catch (e: PackageManager.NameNotFoundException) {
    null
  }

  private fun toMap(pm: PackageManager, ai: ApplicationInfo, includeIcon: Boolean) = mapOf(
    "packageName" to ai.packageName,
    "label" to pm.getApplicationLabel(ai).toString(),
    "category" to categoryKey(ai),
    "isSystem" to ((ai.flags and ApplicationInfo.FLAG_SYSTEM) != 0),
    "icon" to if (includeIcon) iconDataUri(pm.getApplicationIcon(ai)) else null,
  )

  /** Android's own app category (API 26+). Many apps don't set it -> "other". */
  private fun categoryKey(ai: ApplicationInfo): String {
    if (Build.VERSION.SDK_INT < 26) return "other"
    return when (ai.category) {
      ApplicationInfo.CATEGORY_GAME -> "games"
      ApplicationInfo.CATEGORY_SOCIAL -> "social"
      ApplicationInfo.CATEGORY_VIDEO -> "video"
      ApplicationInfo.CATEGORY_AUDIO -> "audio"
      ApplicationInfo.CATEGORY_IMAGE -> "photos"
      ApplicationInfo.CATEGORY_NEWS -> "news"
      ApplicationInfo.CATEGORY_MAPS -> "maps"
      ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
      else -> "other"
    }
  }

  private fun iconDataUri(d: Drawable, size: Int = 96): String {
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    val icon = d.mutate()
    icon.setBounds(0, 0, size, size)
    icon.draw(canvas)
    val out = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
    bmp.recycle()
    return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }

  private fun hasUsageAccess(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= 29) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName
      )
    }
    return if (mode == AppOpsManager.MODE_DEFAULT) {
      context.checkCallingOrSelfPermission(Manifest.permission.PACKAGE_USAGE_STATS) ==
        PackageManager.PERMISSION_GRANTED
    } else {
      mode == AppOpsManager.MODE_ALLOWED
    }
  }

  private fun sessionMap(s: AppSession): Map<String, Any?> = mapOf(
    "sessionId" to s.id,
    "packageName" to s.pkg,
    "label" to s.label,
    "goal" to s.goal,
    "budgetSec" to s.budgetMs / 1000.0,
    "remainingSec" to s.remainingMs / 1000.0,
    "frequency" to s.frequency,
    "everyHours" to s.everyHours,
    "createdAt" to s.createdAt.toDouble(), // JS numbers are doubles
    "startedAt" to if (s.startedAt == 0L) null else s.startedAt.toDouble(),
    "status" to s.status,
    "cooldownUntil" to if (s.cooldownUntil == 0L) null else s.cooldownUntil.toDouble(),
    "checkIns" to s.checkIns,
    "logs" to s.logs.map { listOf(it.start.toDouble(), it.end.toDouble()) },
  )

  /**
   * Foreground time per day for the last [days] days (today included), from usage events,
   * which is how Digital Wellbeing counts it. RemindU itself and the home screen are left out.
   */
  private fun screenTime(days: Int): List<Map<String, Any?>> {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val pm = context.packageManager
    val home = pm.resolveActivity(
      Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY
    )?.activityInfo?.packageName
    val skip = setOf(context.packageName, home)
    val now = System.currentTimeMillis()
    val day = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
    }
    val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    val labels = HashMap<String, String>()

    return (0 until days).map { i ->
      val start = (day.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -i) }
      val from = start.timeInMillis
      val to = minOf(now, (start.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, 1) }.timeInMillis)
      val perApp = foregroundTotals(usm, from, to).filterKeys { it !in skip }
      val top = perApp.entries.sortedByDescending { it.value }.take(5).map { (pkg, ms) ->
        val label = labels.getOrPut(pkg) {
          try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
        }
        mapOf("packageName" to pkg, "label" to label, "ms" to ms.toDouble())
      }
      mapOf("date" to fmt.format(Date(from)), "totalMs" to perApp.values.sum().toDouble(), "apps" to top)
    }
  }

  /** Sums resumed -> paused/stopped spans per package; the screen turning off ends a span. */
  @Suppress("DEPRECATION")
  private fun foregroundTotals(usm: UsageStatsManager, from: Long, to: Long): Map<String, Long> {
    val totals = HashMap<String, Long>()
    val events = usm.queryEvents(from, to)
    val e = UsageEvents.Event()
    var current: String? = null
    var since = 0L
    fun close(at: Long) {
      current?.let { totals[it] = (totals[it] ?: 0L) + (at - since).coerceAtLeast(0L) }
      current = null
    }
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        UsageEvents.Event.MOVE_TO_FOREGROUND -> {
          if (current != e.packageName) {
            close(e.timeStamp)
            current = e.packageName
            since = e.timeStamp
          }
        }
        UsageEvents.Event.MOVE_TO_BACKGROUND, 23 /* ACTIVITY_STOPPED */ ->
          if (current == e.packageName) close(e.timeStamp)
        UsageEvents.Event.SCREEN_NON_INTERACTIVE, UsageEvents.Event.KEYGUARD_SHOWN -> close(e.timeStamp)
      }
    }
    close(to)
    return totals
  }

  private fun stateMap(ruleId: String): Map<String, Any?>? {
    val rule = LimiterStore.rule(context, ruleId) ?: return null
    val s = LimiterStore.state(context, ruleId)
    return mapOf(
      "ruleId" to rule.id,
      "name" to rule.name,
      "sessionsPerDay" to rule.sessionsPerDay,
      "sessionMinutes" to rule.sessionMinutes,
      "used" to s.used,
      "activeUntil" to s.activeUntil.toDouble(), // JS numbers are doubles
      "date" to s.date,
    )
  }
}
