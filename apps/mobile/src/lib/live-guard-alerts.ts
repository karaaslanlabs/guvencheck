import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CHANNEL_ID = 'guvencheck-live-guard';

type NotificationsModule = typeof import('expo-notifications');
let notificationsPromise: Promise<NotificationsModule> | null = null;

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

async function getNotifications() {
  if (Platform.OS !== 'android' || isExpoGo()) return null;
  if (!notificationsPromise) notificationsPromise = import('expo-notifications');
  return notificationsPromise;
}

export async function ensureLiveGuardAlertPermission() {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return false;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Canlı Koruma uyarıları',
      description: 'Yüksek güvenli risk algılandığında GüvenCheck uyarıları.',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      showBadge: false,
    });

    let permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) {
      permissions = await Notifications.requestPermissionsAsync();
    }
    return permissions.granted;
  } catch {
    return false;
  }
}
