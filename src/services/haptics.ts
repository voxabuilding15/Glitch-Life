import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function lightTap(enabled: boolean): void {
  if (!enabled || Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function successTap(enabled: boolean): void {
  if (!enabled || Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
