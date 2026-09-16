import { NativeModules, Platform } from 'react-native';
import type { ProtectionActivityEntry } from './protection-activity';

type LiveGuardNativeModule = {
  isNotificationAccessEnabled(): Promise<boolean>;
  openNotificationAccessSettings(): Promise<boolean>;
  getProtectionActivityJson(): Promise<string>;
  clearProtectionActivity(): Promise<boolean>;
};

function nativeModule(): LiveGuardNativeModule | null {
  if (Platform.OS !== 'android') return null;
  return (NativeModules.GuvenCheckLiveGuard as LiveGuardNativeModule | undefined) ?? null;
}

export function isLiveGuardNativeAvailable() {
  return nativeModule() !== null;
}

export async function isNotificationAccessEnabled() {
  return (await nativeModule()?.isNotificationAccessEnabled()) ?? false;
}

export async function openNotificationAccessSettings() {
  return (await nativeModule()?.openNotificationAccessSettings()) ?? false;
}

export async function getProtectionActivity(): Promise<ProtectionActivityEntry[]> {
  const raw = await nativeModule()?.getProtectionActivityJson();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function clearProtectionActivity() {
  return (await nativeModule()?.clearProtectionActivity()) ?? false;
}
