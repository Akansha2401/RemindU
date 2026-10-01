package expo.modules.applimiter

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** One limit the user created, e.g. "Social: 3 sessions/day, 60 min each". */
data class LimitRule(
  val id: String,
  val name: String,
  val packages: Set<String>,
  val sessionsPerDay: Int,
  val sessionMinutes: Int,
  val enabled: Boolean,
)

/** Today's usage of one rule. Resets automatically when the date changes. */
data class RuleState(
  val date: String,
  val used: Int,
  val activeUntil: Long, // epoch ms; 0 = no session started today
)

/**
 * On-device source of truth for enforcement.
 * Lives in SharedPreferences so it works offline and survives app kills/reboots.
 * Supabase is only a backup/sync of the rules, never needed at enforcement time.
 */
object LimiterStore {
  private const val PREFS = "remindu_limiter"
  private const val KEY_RULES = "rules"
  private const val KEY_STATE = "state"
  private const val KEY_MONITORING = "monitoring"

  @Volatile private var cachedRules: List<LimitRule>? = null

  private fun prefs(ctx: Context): SharedPreferences =
    ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  // ---------- rules ----------

  fun saveRules(ctx: Context, json: String) {
    JSONArray(json) // throws on invalid JSON so JS gets a clear error
    prefs(ctx).edit().putString(KEY_RULES, json).apply()
    cachedRules = null
  }

  fun rules(ctx: Context): List<LimitRule> {
    cachedRules?.let { return it }
    val arr = JSONArray(prefs(ctx).getString(KEY_RULES, "[]") ?: "[]")
    val parsed = (0 until arr.length()).map { i ->
      val o = arr.getJSONObject(i)
      val pk = o.getJSONArray("packages")
      LimitRule(
        id = o.getString("id"),
        name = o.optString("name", "Limit"),
        packages = (0 until pk.length()).map { pk.getString(it) }.toSet(),
        sessionsPerDay = o.getInt("sessionsPerDay"),
        sessionMinutes = o.getInt("sessionMinutes"),
        enabled = o.optBoolean("enabled", true),
      )
    }
    cachedRules = parsed
    return parsed
  }

  fun rule(ctx: Context, id: String): LimitRule? = rules(ctx).firstOrNull { it.id == id }

  fun ruleFor(ctx: Context, pkg: String): LimitRule? =
    rules(ctx).firstOrNull { it.enabled && pkg in it.packages }

  // ---------- daily state ----------

  @Synchronized
  fun state(ctx: Context, ruleId: String): RuleState {
    val all = JSONObject(prefs(ctx).getString(KEY_STATE, "{}") ?: "{}")
    val o = all.optJSONObject(ruleId)
    val today = today()
    if (o == null || o.optString("date") != today) return RuleState(today, 0, 0L)
    return RuleState(today, o.optInt("used"), o.optLong("activeUntil"))
  }

  /** Returns the new state, or null if the daily limit is used up / rule missing. */
  @Synchronized
  fun startSession(ctx: Context, ruleId: String): RuleState? {
    val rule = rule(ctx, ruleId) ?: return null
    val s = state(ctx, ruleId)
    val now = System.currentTimeMillis()
    if (s.activeUntil > now) return s // already running, don't count twice
    if (s.used >= rule.sessionsPerDay) return null
    val next = RuleState(s.date, s.used + 1, now + rule.sessionMinutes * 60_000L)
    writeState(ctx, ruleId, next)
    return next
  }

  @Synchronized
  fun endSession(ctx: Context, ruleId: String) {
    val s = state(ctx, ruleId)
    val now = System.currentTimeMillis()
    if (s.activeUntil > now) writeState(ctx, ruleId, s.copy(activeUntil = now))
  }

  private fun writeState(ctx: Context, ruleId: String, s: RuleState) {
    val p = prefs(ctx)
    val all = JSONObject(p.getString(KEY_STATE, "{}") ?: "{}")
    all.put(
      ruleId,
      JSONObject().put("date", s.date).put("used", s.used).put("activeUntil", s.activeUntil),
    )
    p.edit().putString(KEY_STATE, all.toString()).apply()
  }

  // ---------- on/off switch (used by BootReceiver) ----------

  fun setMonitoring(ctx: Context, on: Boolean) =
    prefs(ctx).edit().putBoolean(KEY_MONITORING, on).apply()

  fun isMonitoring(ctx: Context): Boolean = prefs(ctx).getBoolean(KEY_MONITORING, false)
}
