import { NativeModules, Platform } from 'react-native';
import type { ProtectionActivityEntry } from './protection-activity';

type LiveGuardNativeModule = {
  isNotificationAccessEnabled(): Promise<boolean>;
  requestListenerRebind(): Promise<boolean>;
  openNotificationAccessSettings(): Promise<boolean>;
  getProtectionActivityJson(): Promise<string>;
  getDiagnosticsJson(): Promise<string>;
  scanActiveNotifications(): Promise<number>;
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

export async function requestLiveGuardRebind() {
  try {
    return (await nativeModule()?.requestListenerRebind()) ?? false;
  } catch {
    return false;
  }
}

export async function openNotificationAccessSettings() {
  return (await nativeModule()?.openNotificationAccessSettings()) ?? false;
}

export type LiveGuardDiagnostics = {
  listenerConnected: boolean;
  serviceCreatedAt: number;
  listenerConnectedAt: number;
  listenerDisconnectedAt: number;
  notificationCallbacks: number;
  supportedCallbacks: number;
  groupSummarySkipped: number;
  emptyContentSkipped: number;
  duplicateSkipped: number;
  assessedCallbacks: number;
  recordedCallbacks: number;
  activeScans: number;
  activeScanSupported: number;
  lastCallbackAt: number;
  lastSupportedAt: number;
};

export async function getLiveGuardDiagnostics(): Promise<LiveGuardDiagnostics> {
  const fallback: LiveGuardDiagnostics = {
    listenerConnected: false,
    serviceCreatedAt: 0,
    listenerConnectedAt: 0,
    listenerDisconnectedAt: 0,
    notificationCallbacks: 0,
    supportedCallbacks: 0,
    groupSummarySkipped: 0,
    emptyContentSkipped: 0,
    duplicateSkipped: 0,
    assessedCallbacks: 0,
    recordedCallbacks: 0,
    activeScans: 0,
    activeScanSupported: 0,
    lastCallbackAt: 0,
    lastSupportedAt: 0,
  };
  const raw = await nativeModule()?.getDiagnosticsJson();
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export async function scanActiveNotifications() {
  try {
    return (await nativeModule()?.scanActiveNotifications()) ?? 0;
  } catch {
    return 0;
  }
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
