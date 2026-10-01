package expo.modules.applimiter

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Restarts the watcher after a reboot if app limits are on or an app session exists. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
    if (!LimiterStore.needsService(context)) return
    try {
      LimiterService.start(context)
    } catch (e: Exception) {
      Log.w("RemindULimiter", "Could not restart after boot", e)
    }
  }
}
