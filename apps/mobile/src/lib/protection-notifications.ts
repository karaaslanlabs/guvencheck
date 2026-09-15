import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { ProtectionCandidate, ProtectionReminderState } from './types';
import { getProtectionReminderAt } from './protection-reminder-policy';

const CHANNEL_ID = 'guvencheck-protection';

export type ProtectionReminderResult = {
  reminderState: ProtectionReminderState;
  notificationId?: string;
  reminderAt?: string;
};

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Koruma hatırlatmaları',
    description: 'Korumaya alınan önemli tarihler için seçili hatırlatmalar.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    showBadge: false,
  });
}

export function configureProtectionNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    }),
  });
}

export async function scheduleProtectionReminder(
  candidate: ProtectionCandidate,
): Promise<ProtectionReminderResult> {
  if (Platform.OS === 'web') return { reminderState: 'unavailable' };
  const reminderAt = getProtectionReminderAt(candidate.deadline);
  if (!reminderAt) return { reminderState: 'not_scheduled' };

  try {
    await ensureAndroidChannel();
    let permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) permissions = await Notifications.requestPermissionsAsync();
    if (!permissions.granted) return { reminderState: 'permission_denied' };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'GüvenCheck koruma hatırlatması',
        body: 'Korumaya aldığın işlem için kritik tarih yaklaşıyor. Sıradaki güvenli adımı kontrol et.',
        sound: 'default',
        data: { kind: 'protection-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderAt,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });

    return {
      reminderState: 'scheduled',
      notificationId,
      reminderAt: reminderAt.toISOString(),
    };
  } catch {
    return { reminderState: 'unavailable' };
  }
}

export async function cancelProtectionReminder(notificationId?: string) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}
