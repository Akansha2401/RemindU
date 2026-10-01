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

/** One stretch of time an app was open: [start, end] in epoch ms. */
data class UsageLog(val start: Long, val end: Long)

/**
 * A timer for one app. It waits until the app is first opened, then counts [remainingMs]
 * down only while that app is in the foreground and the screen is on.
 */
data class AppSession(
  val id: String,
  val pkg: String,
  val label: String,
  val goal: String,
  val budgetMs: Long, // session length
  val remainingMs: Long,
  val frequency: String, // once | every | continuous
  val everyHours: Int,
  val createdAt: Long,
  val startedAt: Long, // first time the app was opened; 0 = still waiting
  val status: String, // waiting | counting | paused | time_up
  val checkIns: Int, // times the user came back after time was up
  val logs: List<UsageLog>,
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

  /** The watcher service is needed while app limits are on or any app session exists. */
  fun needsService(ctx: Context): Boolean = isMonitoring(ctx) || sessions(ctx).isNotEmpty()

  // ---------- app sessions ----------

  private const val KEY_SESSIONS = "app_sessions"
  private const val MAX_LOGS = 300

  @Volatile private var cachedSessions: List<AppSession>? = null

  @Synchronized
  fun sessions(ctx: Context): List<AppSession> {
    cachedSessions?.let { return it }
    val arr = JSONArray(prefs(ctx).getString(KEY_SESSIONS, "[]") ?: "[]")
    val parsed = (0 until arr.length()).map { parseSession(arr.getJSONObject(it)) }
    cachedSessions = parsed
    return parsed
  }

  @Synchronized
  fun session(ctx: Context, id: String): AppSession? = sessions(ctx).firstOrNull { it.id == id }

  @Synchronized
  fun saveSessions(ctx: Context, list: List<AppSession>) {
    cachedSessions = list
    val arr = JSONArray()
    list.forEach { arr.put(sessionJson(it)) }
    prefs(ctx).edit().putString(KEY_SESSIONS, arr.toString()).apply()
  }

  @Synchronized
  fun updateSession(ctx: Context, next: AppSession) {
    saveSessions(ctx, sessions(ctx).map { if (it.id == next.id) next else it })
  }

  /**
   * [json]: [{ sessionId, packageName, label, goal, budgetSec, frequency, everyHours }] from JS.
   * Each app has at most one session, so adding an app again replaces its old timer.
   */
  @Synchronized
  fun addSessions(ctx: Context, json: String): List<AppSession> {
    val arr = JSONArray(json)
    val now = System.currentTimeMillis()
    val added = (0 until arr.length()).map { i ->
      val o = arr.getJSONObject(i)
      val budgetMs = o.getLong("budgetSec") * 1000L
      AppSession(
        id = o.getString("sessionId"),
        pkg = o.getString("packageName"),
        label = o.optString("label", o.getString("packageName")),
        goal = o.optString("goal", ""),
        budgetMs = budgetMs,
        remainingMs = budgetMs,
        frequency = o.optString("frequency", "once"),
        everyHours = o.optInt("everyHours", 1),
        createdAt = now,
        startedAt = 0L,
        status = "waiting",
        checkIns = 0,
        logs = emptyList(),
      )
    }
    val pkgs = added.map { it.pkg }.toSet()
    saveSessions(ctx, sessions(ctx).filter { it.pkg !in pkgs } + added)
    return added
  }

  /** Starts a new budget after time ran out (every X hrs / continuous). */
  @Synchronized
  fun continueSession(ctx: Context, id: String, budgetMs: Long): AppSession? {
    val s = session(ctx, id) ?: return null
    val next = s.copy(remainingMs = budgetMs, status = "paused", checkIns = s.checkIns + 1)
    updateSession(ctx, next)
    return next
  }

  /** Removes the session and returns it as it was, so JS can keep its history. */
  @Synchronized
  fun removeSession(ctx: Context, id: String): AppSession? {
    val s = session(ctx, id) ?: return null
    saveSessions(ctx, sessions(ctx).filter { it.id != id })
    return s
  }

  /** Extends the current usage log, or starts a new one after a gap. */
  fun withUsage(s: AppSession, from: Long, now: Long, gapMs: Long): AppSession {
    val last = s.logs.lastOrNull()
    val logs = if (last != null && from - last.end <= gapMs) {
      s.logs.dropLast(1) + last.copy(end = now)
    } else {
      (s.logs + UsageLog(from, now)).takeLast(MAX_LOGS)
    }
    return s.copy(logs = logs)
  }

  private fun sessionJson(s: AppSession): JSONObject {
    val logs = JSONArray()
    s.logs.forEach { logs.put(JSONArray().put(it.start).put(it.end)) }
    return JSONObject()
      .put("id", s.id)
      .put("pkg", s.pkg)
      .put("label", s.label)
      .put("goal", s.goal)
      .put("budgetMs", s.budgetMs)
      .put("remainingMs", s.remainingMs)
      .put("frequency", s.frequency)
      .put("everyHours", s.everyHours)
      .put("createdAt", s.createdAt)
      .put("startedAt", s.startedAt)
      .put("status", s.status)
      .put("checkIns", s.checkIns)
      .put("logs", logs)
  }

  private fun parseSession(o: JSONObject): AppSession {
    val arr = o.optJSONArray("logs") ?: JSONArray()
    val logs = (0 until arr.length()).map {
      val l = arr.getJSONArray(it)
      UsageLog(l.getLong(0), l.getLong(1))
    }
    return AppSession(
      id = o.getString("id"),
      pkg = o.getString("pkg"),
      label = o.optString("label", o.getString("pkg")),
      goal = o.optString("goal", ""),
      budgetMs = o.getLong("budgetMs"),
      remainingMs = o.getLong("remainingMs"),
      frequency = o.optString("frequency", "once"),
      everyHours = o.optInt("everyHours", 1),
      createdAt = o.getLong("createdAt"),
      startedAt = o.optLong("startedAt", 0L),
      status = o.optString("status", "waiting"),
      checkIns = o.optInt("checkIns", 0),
      logs = logs,
    )
  }
}
