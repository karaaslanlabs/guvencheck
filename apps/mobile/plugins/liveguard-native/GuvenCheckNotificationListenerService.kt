package com.guvencheck.app.liveguard

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class GuvenCheckNotificationListenerService : NotificationListenerService() {
  companion object {
    private val supportedPackages = setOf(
      "com.whatsapp",
      "org.telegram.messenger",
      "com.google.android.apps.messaging",
      "com.samsung.android.messaging",
      "com.facebook.orca",
      "com.instagram.android",
    )
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val notification = sbn ?: return
    if (notification.packageName !in supportedPackages) return

    val extras = notification.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
    val text = (
      extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
        ?: extras.getCharSequence(Notification.EXTRA_TEXT)
    )?.toString()
    if (title.isNullOrBlank() && text.isNullOrBlank()) return

    val assessment = LiveGuardPolicy.assess(title, text)
    ProtectionActivityStore.record(
      applicationContext,
      assessment,
      notification.packageName,
      notification.postTime,
    )
  }
}
