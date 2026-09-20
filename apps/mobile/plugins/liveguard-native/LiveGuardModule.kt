package com.guvencheck.app.liveguard

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.service.notification.NotificationListenerService
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LiveGuardModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "GuvenCheckLiveGuard"

  @ReactMethod
  fun isNotificationAccessEnabled(promise: Promise) {
    val enabled = NotificationManagerCompat
      .getEnabledListenerPackages(reactApplicationContext)
      .contains(reactApplicationContext.packageName)
    promise.resolve(enabled)
  }

  @ReactMethod
  fun requestListenerRebind(promise: Promise) {
    runCatching {
      val component = ComponentName(
        reactApplicationContext,
        GuvenCheckNotificationListenerService::class.java,
      )
      NotificationListenerService.requestRebind(component)
    }.onSuccess { promise.resolve(true) }
      .onFailure { promise.reject("LIVE_GUARD_REBIND", it) }
  }

  @ReactMethod
  fun openNotificationAccessSettings(promise: Promise) {
    runCatching {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
    }.onSuccess { promise.resolve(true) }
      .onFailure { promise.reject("LIVE_GUARD_SETTINGS", it) }
  }

  @ReactMethod
  fun getProtectionActivityJson(promise: Promise) {
    promise.resolve(ProtectionActivityStore.readJson(reactApplicationContext))
  }

  @ReactMethod
  fun clearProtectionActivity(promise: Promise) {
    ProtectionActivityStore.clear(reactApplicationContext)
    promise.resolve(true)
  }
}
