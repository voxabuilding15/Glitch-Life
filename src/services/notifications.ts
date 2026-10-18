import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'glitchlife-default';

/** All functions are safe to call when notifications are unavailable or denied: they resolve to null/false. */

export function configureNotifications(): void {
  if (Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Glitch Life',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  } catch {
    // notifications are optional
  }
}

/** Asks for permission only when it has not been decided yet. Returns whether notifications may be shown. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}

export interface NotificationText {
  title: string;
  body: string;
}

export async function scheduleFocusEnd(endsAt: number, text: NotificationText): Promise<string | null> {
  if (Platform.OS === 'web' || endsAt <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: text.title, body: text.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: endsAt, channelId: CHANNEL_ID },
    });
  } catch {
    return null;
  }
}

export async function scheduleDailyReminder(hour: number, minute: number, text: NotificationText): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: text.title, body: text.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(id: string | null | undefined): Promise<void> {
  if (!id || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}
