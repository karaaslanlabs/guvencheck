package com.guvencheck.app.liveguard

import android.content.Context
import org.json.JSONObject

object LiveGuardDiagnosticsStore {
  private const val PREFS = "guvencheck_live_guard_diagnostics"
  private const val KEY_CONNECTED = "listener_connected"
  private const val KEY_CREATED_AT = "service_created_at"
  private const val KEY_CONNECTED_AT = "listener_connected_at"
  private const val KEY_DISCONNECTED_AT = "listener_disconnected_at"
  private const val KEY_CALLBACKS = "notification_callbacks"
  private const val KEY_SUPPORTED_CALLBACKS = "supported_callbacks"
  private const val KEY_GROUP_SUMMARY_SKIPPED = "group_summary_skipped"
  private const val KEY_EMPTY_CONTENT_SKIPPED = "empty_content_skipped"
  private const val KEY_DUPLICATE_SKIPPED = "duplicate_skipped"
  private const val KEY_ASSESSED = "assessed_callbacks"
  private const val KEY_RECORDED = "recorded_callbacks"
  private const val KEY_ACTIVE_SCANS = "active_scans"
  private const val KEY_ACTIVE_SCAN_SUPPORTED = "active_scan_supported"
  private const val KEY_LAST_CALLBACK_AT = "last_callback_at"
  private const val KEY_LAST_SUPPORTED_AT = "last_supported_at"

  fun serviceCreated(context: Context, now: Long = System.currentTimeMillis()) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_CONNECTED, false)
      .putLong(KEY_CREATED_AT, now)
      .apply()
  }
  fun listenerConnected(context: Context, now: Long = System.currentTimeMillis()) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit().putBoolean(KEY_CONNECTED, true).putLong(KEY_CONNECTED_AT, now).apply()
  }

  fun listenerDisconnected(context: Context, now: Long = System.currentTimeMillis()) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit().putBoolean(KEY_CONNECTED, false).putLong(KEY_DISCONNECTED_AT, now).apply()
  }

  private fun increment(context: Context, key: String) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit().putInt(key, prefs.getInt(key, 0) + 1).apply()
  }

  fun notificationCallback(
    context: Context,
    supported: Boolean,
    now: Long = System.currentTimeMillis(),
  ) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val editor = prefs.edit()
      .putInt(KEY_CALLBACKS, prefs.getInt(KEY_CALLBACKS, 0) + 1)
      .putLong(KEY_LAST_CALLBACK_AT, now)
    if (supported) {
      editor
        .putInt(KEY_SUPPORTED_CALLBACKS, prefs.getInt(KEY_SUPPORTED_CALLBACKS, 0) + 1)
        .putLong(KEY_LAST_SUPPORTED_AT, now)
    }
    editor.apply()
  }

  fun groupSummarySkipped(context: Context) = increment(context, KEY_GROUP_SUMMARY_SKIPPED)
  fun emptyContentSkipped(context: Context) = increment(context, KEY_EMPTY_CONTENT_SKIPPED)
  fun duplicateSkipped(context: Context) = increment(context, KEY_DUPLICATE_SKIPPED)
  fun assessed(context: Context) = increment(context, KEY_ASSESSED)
  fun recorded(context: Context) = increment(context, KEY_RECORDED)

  fun activeScan(context: Context, supportedCount: Int) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit()
      .putInt(KEY_ACTIVE_SCANS, prefs.getInt(KEY_ACTIVE_SCANS, 0) + 1)
      .putInt(KEY_ACTIVE_SCAN_SUPPORTED, supportedCount)
      .apply()
  }

  fun resetCounters(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_CALLBACKS)
      .remove(KEY_SUPPORTED_CALLBACKS)
      .remove(KEY_GROUP_SUMMARY_SKIPPED)
      .remove(KEY_EMPTY_CONTENT_SKIPPED)
      .remove(KEY_DUPLICATE_SKIPPED)
      .remove(KEY_ASSESSED)
      .remove(KEY_RECORDED)
      .remove(KEY_ACTIVE_SCANS)
      .remove(KEY_ACTIVE_SCAN_SUPPORTED)
      .remove(KEY_LAST_CALLBACK_AT)
      .remove(KEY_LAST_SUPPORTED_AT)
      .apply()
  }
  fun readJson(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return JSONObject()
      .put("listenerConnected", prefs.getBoolean(KEY_CONNECTED, false))
      .put("serviceCreatedAt", prefs.getLong(KEY_CREATED_AT, 0L))
      .put("listenerConnectedAt", prefs.getLong(KEY_CONNECTED_AT, 0L))
      .put("listenerDisconnectedAt", prefs.getLong(KEY_DISCONNECTED_AT, 0L))
      .put("notificationCallbacks", prefs.getInt(KEY_CALLBACKS, 0))
      .put("supportedCallbacks", prefs.getInt(KEY_SUPPORTED_CALLBACKS, 0))
      .put("groupSummarySkipped", prefs.getInt(KEY_GROUP_SUMMARY_SKIPPED, 0))
      .put("emptyContentSkipped", prefs.getInt(KEY_EMPTY_CONTENT_SKIPPED, 0))
      .put("duplicateSkipped", prefs.getInt(KEY_DUPLICATE_SKIPPED, 0))
      .put("assessedCallbacks", prefs.getInt(KEY_ASSESSED, 0))
      .put("recordedCallbacks", prefs.getInt(KEY_RECORDED, 0))
      .put("activeScans", prefs.getInt(KEY_ACTIVE_SCANS, 0))
      .put("activeScanSupported", prefs.getInt(KEY_ACTIVE_SCAN_SUPPORTED, 0))
      .put("lastCallbackAt", prefs.getLong(KEY_LAST_CALLBACK_AT, 0L))
      .put("lastSupportedAt", prefs.getLong(KEY_LAST_SUPPORTED_AT, 0L))
      .toString()
  }
}
