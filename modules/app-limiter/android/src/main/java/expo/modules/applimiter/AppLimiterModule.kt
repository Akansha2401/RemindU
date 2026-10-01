package expo.modules.applimiter

import android.Manifest
import android.app.AppOpsManager
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

    // ----- focus session (Setup -> Start session) -----
    Function("startFocusSession") { json: String ->
      LimiterStore.startFocus(context, json)
      LimiterService.start(context)
    }
    Function("getFocusSession") { LimiterStore.focusSession(context)?.let { focusMap(it) } }
    Function("continueFocusSession") { budgetSec: Double ->
      LimiterStore.continueFocus(context, (budgetSec * 1000).toLong())?.let { focusMap(it) }
    }
    Function("endFocusSession") {
      LimiterStore.clearFocus(context)
      if (LimiterStore.needsService(context)) LimiterService.start(context) // refresh notification
      else LimiterService.stop(context)
    }

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

  private fun focusMap(s: FocusSession): Map<String, Any?> = mapOf(
    "sessionId" to s.id,
    "goal" to s.goal,
    "budgetSec" to s.budgetMs / 1000.0,
    "remainingSec" to s.remainingMs / 1000.0,
    "packages" to s.packages.toList(),
    "frequency" to s.frequency,
    "everyHours" to s.everyHours,
    "startedAt" to s.startedAt.toDouble(),
    "status" to s.status,
    "foregroundPackage" to s.foreground,
  )

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
