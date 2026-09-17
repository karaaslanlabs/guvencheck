package com.guvencheck.app.liveguard

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build

object LiveGuardAlertNotifier {
  const val CHANNEL_ID = "guvencheck-live-guard"
  private const val CHANNEL_NAME = "Canlı Koruma uyarıları"
  private const val CHANNEL_DESCRIPTION = "Yüksek güvenli risk algılandığında GüvenCheck uyarıları."

  fun show(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return

    val manager = context.getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH).apply {
          description = CHANNEL_DESCRIPTION
        },
      )
    }

    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    val pendingIntent = launchIntent?.let {
      PendingIntent.getActivity(
        context,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
    val body = "Şüpheli bir bildirim algılandı. GüvenCheck’i açıp kontrol et."
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      Notification.Builder(context).setPriority(Notification.PRIORITY_HIGH)
    }
    val notification = builder
      .setSmallIcon(android.R.drawable.stat_sys_warning)
      .setContentTitle("GüvenCheck uyarısı")
      .setContentText(body)
      .setStyle(Notification.BigTextStyle().bigText(body))
      .setCategory(Notification.CATEGORY_ERROR)
      .setAutoCancel(true)
      .apply { if (pendingIntent != null) setContentIntent(pendingIntent) }
      .build()

    manager.notify((System.currentTimeMillis() and 0x7fffffff).toInt(), notification)
  }
}
