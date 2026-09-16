package com.guvencheck.app.liveguard

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

object ProtectionActivityStore {
  private const val PREFS = "guvencheck_live_guard"
  private const val KEY = "activity"
  private const val MAX_ENTRIES = 100

  private fun isoUtc(timestamp: Long): String {
    val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    format.timeZone = TimeZone.getTimeZone("UTC")
    return format.format(Date(timestamp))
  }

  @Synchronized
  fun record(context: Context, assessment: NativeLiveGuardAssessment, sourcePackage: String, checkedAt: Long) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val old = runCatching { JSONArray(prefs.getString(KEY, "[]")) }.getOrElse { JSONArray() }
    val next = JSONArray()
    val reasonArray = JSONArray()
    assessment.reasonCodes.take(8).forEach { reasonArray.put(it) }
    val event = JSONObject()
      .put("id", UUID.randomUUID().toString())
      .put("checkedAt", isoUtc(checkedAt))
      .put("decision", assessment.decision)
      .put("confidence", assessment.confidence)
      .put("reasonCodes", reasonArray)
      .put("sourcePackage", sourcePackage.take(180))

    next.put(event)
    for (index in 0 until minOf(old.length(), MAX_ENTRIES - 1)) next.put(old.get(index))
    prefs.edit().putString(KEY, next.toString()).apply()
  }

  fun readJson(context: Context): String =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]") ?: "[]"

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply()
  }
}
