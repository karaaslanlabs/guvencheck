import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  clearProtectionActivity,
  getLiveGuardDiagnostics,
  getProtectionActivity,
  isLiveGuardNativeAvailable,
  isNotificationAccessEnabled,
  requestLiveGuardRebind,
  openNotificationAccessSettings,
} from '../lib/live-guard-native';
import { summarizeProtectionActivity } from '../lib/protection-activity';
import { ensureLiveGuardAlertPermission } from '../lib/live-guard-alerts';

export function LiveGuardCard() {
  const nativeAvailable = isLiveGuardNativeAvailable();
  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof getProtectionActivity>>>([]);
  const [diagnostics, setDiagnostics] = useState<Awaited<ReturnType<typeof getLiveGuardDiagnostics>> | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!nativeAvailable) return;
    const access = await isNotificationAccessEnabled();
    if (access) {
      await requestLiveGuardRebind();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const [activity, nextDiagnostics] = await Promise.all([
      getProtectionActivity(),
      getLiveGuardDiagnostics(),
    ]);
    setEnabled(access);
    setEntries(activity);
    setDiagnostics(nextDiagnostics);
  }, [nativeAvailable]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    void ensureLiveGuardAlertPermission();
  }, [enabled]);

  const summary = summarizeProtectionActivity(entries);
  const lastChecked = summary.lastCheckedAt
    ? new Date(summary.lastCheckedAt).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : '';

  async function requestAccess() {
    setBusy(true);
    try {
      await openNotificationAccessSettings();
    } finally {
      setBusy(false);
    }
  }

  async function clearActivity() {
    setBusy(true);
    try {
      await clearProtectionActivity();
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  if (!nativeAvailable) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>CANLI KORUMA</Text>
        <Text style={styles.title}>Development APK ile açılacak</Text>
        <Text style={styles.text}>
          Expo Go, Android Bildirim Erişimi özelliğini çalıştıramaz. Native test sürümünde açıldığında desteklenen mesaj bildirimleri cihazda yerel olarak değerlendirilecek.
        </Text>
        <Text style={styles.note}>Ham bildirim içeriği Protection Activity geçmişinde saklanmaz.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>CANLI KORUMA</Text>
          <Text style={styles.title}>
            {!enabled
              ? 'Arka plan korumasını aç'
              : diagnostics?.listenerConnected
                ? 'Arka plan koruması bağlı'
                : 'İzin açık, listener bağlı değil'}
          </Text>
        </View>
        <View style={[styles.statusPill, enabled && diagnostics?.listenerConnected && styles.statusPillOn]}>
          <Text style={styles.statusText}>
            {!enabled ? 'KAPALI' : diagnostics?.listenerConnected ? 'AKTİF' : 'BAĞLANTI YOK'}
          </Text>
        </View>
      </View>
      {!enabled ? (
        <>
          <Text style={styles.text}>
            GüvenCheck yalnız desteklenen iletişim uygulamalarındaki bildirimleri cihaz üzerinde yerel olarak kontrol eder. Yüksek güvenli risk varsa uyarı üretir; her bildirimi buluta göndermez.
          </Text>
          <Pressable onPress={requestAccess} disabled={busy} style={[styles.primaryButton, busy && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{busy ? 'Ayarlar açılıyor…' : 'Bildirim erişimini aç'}</Text>
          </Pressable>
          <Text style={styles.note}>Erişim yalnız sen açarsan etkinleşir ve Android ayarlarından istediğin zaman kapatılabilir.</Text>
        </>
      ) : (
        <>
          <Text style={styles.note}>
            Tanı: listener {diagnostics?.listenerConnected ? 'BAĞLI' : 'BAĞLI DEĞİL'} · callback {diagnostics?.notificationCallbacks ?? 0} · desteklenen {diagnostics?.supportedCallbacks ?? 0}
          </Text>
          <Text style={styles.note}>
            Akış: grup {diagnostics?.groupSummarySkipped ?? 0} · boş {diagnostics?.emptyContentSkipped ?? 0} · kopya {diagnostics?.duplicateSkipped ?? 0} · değerlendirilen {diagnostics?.assessedCallbacks ?? 0} · kayıt {diagnostics?.recordedCallbacks ?? 0}
          </Text>
          <View style={styles.metricsRow}>
            <Metric label="Kontrol" value={summary.checked} />
            <Metric label="Uyarı" value={summary.warnings} />
            <Metric label="İncele" value={summary.reviews} />
            <Metric label="Sessiz" value={summary.quietPasses} />
          </View>
          <Text style={styles.text}>
            {summary.checked === 0
              ? 'Henüz uygun bir bildirim kontrol edilmedi.'
              : `${summary.checked} uygun bildirim yerelde değerlendirildi.`}
          </Text>
          {!!lastChecked && <Text style={styles.note}>Son kontrol: {lastChecked}</Text>}
          <Text style={styles.note}>Activity geçmişinde ham başlık veya mesaj tutulmaz; yalnız karar metadata’sı saklanır.</Text>
          {(summary.checked > 0 || (diagnostics?.notificationCallbacks ?? 0) > 0) && (
            <Pressable onPress={clearActivity} disabled={busy} style={[styles.secondaryButton, busy && styles.disabled]}>
              <Text style={styles.secondaryButtonText}>Koruma geçmişini temizle</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B2A22', borderWidth: 1, borderColor: '#2D6B57',
    borderRadius: 18, padding: 16, gap: 10,
  },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  kicker: { color: '#69D4A5', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#F4FFF9', fontSize: 18, fontWeight: '900', marginTop: 3 },
  text: { color: '#C7DDD5', fontSize: 13, lineHeight: 19 },
  note: { color: '#789D90', fontSize: 10, lineHeight: 15 },
  statusPill: {
    borderWidth: 1, borderColor: '#5D695F', backgroundColor: '#202B26',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  statusPillOn: { borderColor: '#2D8B67', backgroundColor: '#123A30' },
  statusText: { color: '#D9F7EB', fontSize: 10, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: {
    minWidth: 66, flexGrow: 1, backgroundColor: '#071F19', borderWidth: 1,
    borderColor: '#315F51', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9,
  },
  metricValue: { color: '#F4FFF9', fontSize: 18, fontWeight: '900' },
  metricLabel: { color: '#8FB5A7', fontSize: 10, fontWeight: '800', marginTop: 2 },
  primaryButton: {
    backgroundColor: '#18C77A', borderRadius: 12, paddingVertical: 12,
    paddingHorizontal: 14, alignItems: 'center',
  },
  primaryButtonText: { color: '#F4FFF9', fontSize: 13, fontWeight: '900' },
  secondaryButton: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: '#477B6B',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  secondaryButtonText: { color: '#DDF5EB', fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
