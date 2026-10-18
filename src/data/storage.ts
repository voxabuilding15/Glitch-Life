import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/domain/types';
import { createInitialState, migrateState } from './schema';

const KEY = 'glitchlife.state';
const BACKUP_KEY = 'glitchlife.state.corrupt-backup';

export interface LoadResult {
  state: AppState;
  /** True when stored data was unreadable and a fresh state was created. */
  recovered: boolean;
}

export async function loadState(now = Date.now()): Promise<LoadResult> {
  const raw = await AsyncStorage.getItem(KEY); // storage failures propagate to the caller
  if (raw === null) return { state: createInitialState(now), recovered: false };
  try {
    const migrated = migrateState(JSON.parse(raw), now);
    if (migrated) return { state: migrated, recovered: false };
  } catch {
    // fall through to recovery
  }
  await AsyncStorage.setItem(BACKUP_KEY, raw).catch(() => undefined);
  return { state: createInitialState(now), recovered: true };
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
