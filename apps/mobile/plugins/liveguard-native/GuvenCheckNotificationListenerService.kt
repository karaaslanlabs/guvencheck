package com.guvencheck.app.liveguard

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

class GuvenCheckNotificationListenerService : NotificationListenerService() {
  override fun onCreate() {
    super.onCreate()
    LiveGuardDiagnosticsStore.serviceCreated(applicationContext)
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    activeInstance = this
    LiveGuardDiagnosticsStore.listenerConnected(applicationContext)
  }

  override fun onListenerDisconnected() {
    if (activeInstance === this) activeInstance = null
    LiveGuardDiagnosticsStore.listenerDisconnected(applicationContext)
    super.onListenerDisconnected()
  }

  override fun onDestroy() {
    if (activeInstance === this) activeInstance = null
    super.onDestroy()
  }

  companion object {
    private const val DUPLICATE_WINDOW_MS = 5_000L
    @Volatile private var activeInstance: GuvenCheckNotificationListenerService? = null
    private val recentFingerprints = ConcurrentHashMap<String, Long>()
    private val snapshotFingerprints = ConcurrentHashMap.newKeySet<String>()

    fun scanActiveNotifications(): Int =
      activeInstance?.scanActiveNotificationsInternal() ?: 0
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

  private fun processNotification(
    notification: StatusBarNotification,
    countAsCallback: Boolean,
  ): Boolean {
    val supported = notification.packageName in supportedPackages
    if (countAsCallback) {
      LiveGuardDiagnosticsStore.notificationCallback(applicationContext, supported)
    }
    if (!supported) return false
    if ((notification.notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) {
      LiveGuardDiagnosticsStore.groupSummarySkipped(applicationContext)
      return false
    }

    val extras = notification.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
    val text = (
      extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
        ?: extras.getCharSequence(Notification.EXTRA_TEXT)
    )?.toString()
    if (title.isNullOrBlank() && text.isNullOrBlank()) {
      LiveGuardDiagnosticsStore.emptyContentSkipped(applicationContext)
      return false
    }

    val snapshotValue = fingerprint(notification.key, title, text)
    if (!countAsCallback && !snapshotFingerprints.add(snapshotValue)) {
      LiveGuardDiagnosticsStore.duplicateSkipped(applicationContext)
      return false
    }

    val now = System.currentTimeMillis()
    if (isDuplicate(notification.key, title, text, now)) {
      LiveGuardDiagnosticsStore.duplicateSkipped(applicationContext)
      return false
    }

    val assessment = LiveGuardPolicy.assess(title, text)
    LiveGuardDiagnosticsStore.assessed(applicationContext)
    ProtectionActivityStore.record(
      applicationContext,
      assessment,
      notification.packageName,
      notification.postTime,
    )
    LiveGuardDiagnosticsStore.recorded(applicationContext)
    if (countAsCallback) snapshotFingerprints.add(snapshotValue)
    if (assessment.decision == "warn") {
      LiveGuardAlertNotifier.show(applicationContext)
    }
    return true
  }

  private fun scanActiveNotificationsInternal(): Int {
    val notifications = runCatching { activeNotifications.orEmpty() }.getOrElse { emptyArray() }
    val supportedCount = notifications.count { it.packageName in supportedPackages }
    LiveGuardDiagnosticsStore.activeScan(applicationContext, supportedCount)
    notifications.forEach { processNotification(it, countAsCallback = false) }
    return supportedCount
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    sbn?.let { processNotification(it, countAsCallback = true) }
  }
}
