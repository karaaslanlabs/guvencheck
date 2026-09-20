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

  fun readJson(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return JSONObject()
      .put("listenerConnected", prefs.getBoolean(KEY_CONNECTED, false))
      .put("serviceCreatedAt", prefs.getLong(KEY_CREATED_AT, 0L))
      .put("listenerConnectedAt", prefs.getLong(KEY_CONNECTED_AT, 0L))
      .put("listenerDisconnectedAt", prefs.getLong(KEY_DISCONNECTED_AT, 0L))
      .put("notificationCallbacks", prefs.getInt(KEY_CALLBACKS, 0))
      .put("supportedCallbacks", prefs.getInt(KEY_SUPPORTED_CALLBACKS, 0))
      .put("lastCallbackAt", prefs.getLong(KEY_LAST_CALLBACK_AT, 0L))
      .put("lastSupportedAt", prefs.getLong(KEY_LAST_SUPPORTED_AT, 0L))
      .toString()
  }
}
