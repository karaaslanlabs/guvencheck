package com.guvencheck.app.liveguard

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

class GuvenCheckNotificationListenerService : NotificationListenerService() {
  companion object {
    private const val DUPLICATE_WINDOW_MS = 5_000L
    private val recentFingerprints = ConcurrentHashMap<String, Long>()
    private val supportedPackages = setOf(
      "com.whatsapp",
      "org.telegram.messenger",
      "com.google.android.apps.messaging",
      "com.samsung.android.messaging",
      "com.facebook.orca",
      "com.instagram.android",
    )

    private fun fingerprint(key: String, title: String?, text: String?): String {
      val payload = "$key\u0000${title.orEmpty()}\u0000${text.orEmpty()}"
      return MessageDigest.getInstance("SHA-256")
        .digest(payload.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
    }

    private fun isDuplicate(key: String, title: String?, text: String?, now: Long): Boolean {
      val value = fingerprint(key, title, text)
      val previous = recentFingerprints.put(value, now)
      if (recentFingerprints.size > 64) {
        recentFingerprints.entries.removeIf { now - it.value > DUPLICATE_WINDOW_MS }
      }
      return previous != null && now - previous <= DUPLICATE_WINDOW_MS
    }
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val notification = sbn ?: return
    if (notification.packageName !in supportedPackages) return
    if ((notification.notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return

    val extras = notification.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
    val text = (
      extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
        ?: extras.getCharSequence(Notification.EXTRA_TEXT)
    )?.toString()
    if (title.isNullOrBlank() && text.isNullOrBlank()) return

    val now = System.currentTimeMillis()
    if (isDuplicate(notification.key, title, text, now)) return

    val assessment = LiveGuardPolicy.assess(title, text)
    ProtectionActivityStore.record(
      applicationContext,
      assessment,
      notification.packageName,
      notification.postTime,
    )
    if (assessment.decision == "warn") {
      LiveGuardAlertNotifier.show(applicationContext)
    }
  }
}
