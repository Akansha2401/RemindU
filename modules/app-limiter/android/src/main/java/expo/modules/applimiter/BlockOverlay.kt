package expo.modules.applimiter

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen "time's up" window drawn over the app whose timer ran out. It blocks touches on the
 * app below until the user checks in (opens RemindU) or leaves the app.
 *
 * Why a window and not just an activity: since Android 15, "Display over other apps" only lets a
 * background service open an activity while one of its overlay windows is visible. A plain
 * startActivity from the service is silently blocked, so the app stayed usable.
 */
class BlockOverlay(
  private val ctx: Context,
  private val onCheckIn: (sessionId: String) -> Unit,
  private val onLeave: () -> Unit,
) {
  private val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private var view: View? = null
  private var shownId: String? = null

  val isShowing get() = view != null

  /** Shows (or switches to) the block for [session]. Returns false without overlay permission. */
  fun show(session: AppSession): Boolean {
    if (!Settings.canDrawOverlays(ctx)) return false
    if (shownId == session.id && view != null) return true
    hide()
    val v = build(session)
    return try {
      wm.addView(v, params())
      view = v
      shownId = session.id
      true
    } catch (e: Exception) {
      Log.w("RemindULimiter", "Could not show block overlay", e)
      false
    }
  }

  fun hide() {
    view?.let {
      try {
        wm.removeView(it)
      } catch (e: Exception) {
        Log.w("RemindULimiter", "Could not remove block overlay", e)
      }
    }
    view = null
    shownId = null
  }

  private fun params(): WindowManager.LayoutParams {
    @Suppress("DEPRECATION")
    val type = if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    else WindowManager.LayoutParams.TYPE_PHONE
    return WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      // Focusable and touchable on purpose: the app underneath gets no input while this is up.
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.OPAQUE,
    ).apply { gravity = Gravity.CENTER }
  }

  // Colours from the RemindU Design System v1 takeover palette.
  private val takeover = Color.parseColor("#2A1B10")
  private val terracotta = Color.parseColor("#E8703A")
  private val white = Color.WHITE
  private val faded = Color.argb(150, 255, 255, 255)

  private fun dp(v: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, ctx.resources.displayMetrics)

  private fun text(value: String, sizeSp: Float, color: Int, bold: Boolean = false) = TextView(ctx).apply {
    text = value
    setTextColor(color)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    gravity = Gravity.CENTER
    if (bold) typeface = Typeface.DEFAULT_BOLD
  }

  private fun pill(label: String, fill: Int?, textColor: Int, onClick: () -> Unit) =
    text(label, 16f, textColor, bold = true).apply {
      val pad = dp(16f).toInt()
      setPadding(pad, pad, pad, pad)
      if (fill != null) {
        background = GradientDrawable().apply {
          setColor(fill)
          cornerRadius = dp(999f)
        }
      }
      isClickable = true
      setOnClickListener { onClick() }
    }

  private fun build(s: AppSession): View {
    val column = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      val pad = dp(28f).toInt()
      setPadding(pad, pad, pad, pad)
    }
    column.addView(text("TIME'S UP ON ${s.label.uppercase()}", 12f, faded, bold = true))
    if (s.goal.isNotBlank()) {
      column.addView(text("“${s.goal}”", 28f, white, bold = true).apply { setPadding(0, dp(16f).toInt(), 0, 0) })
    }
    column.addView(text("This is what you said you wanted.", 14f, faded).apply { setPadding(0, dp(24f).toInt(), 0, 0) })
    column.addView(text("Take one slow breath before you decide.", 14f, faded).apply { setPadding(0, dp(4f).toInt(), 0, 0) })

    val buttons = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(0, dp(40f).toInt(), 0, 0)
    }
    val full = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
    buttons.addView(pill("Check in", terracotta, white) { onCheckIn(s.id) }, full)
    buttons.addView(
      pill("Close ${s.label}", null, faded) { onLeave() },
      LinearLayout.LayoutParams(full).apply { topMargin = dp(8f).toInt() },
    )
    column.addView(buttons, full)

    // Back leaves the app instead of reaching it.
    return object : FrameLayout(ctx) {
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK) {
          if (event.action == KeyEvent.ACTION_UP) onLeave()
          return true
        }
        return super.dispatchKeyEvent(event)
      }
    }.apply {
      setBackgroundColor(takeover)
      isClickable = true // swallow touches that miss the buttons
      addView(column, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }
  }
}
