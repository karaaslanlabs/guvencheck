import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyze, sendTelemetry } from '../lib/api';
import { uriToDataUrl } from '../lib/image';
import { looksLikeUrl, normalizeUrl } from '../lib/url';
import { createSessionId, getInstallId } from '../lib/install-id';
import { clearProtection, loadProtection, saveProtection } from '../lib/protection-store';
import { getProtectionTiming } from '../lib/protection-status';
import { deriveDeepVerification } from '../lib/deep-verification';
import type { AnalysisResult, AnalysisType, ProtectionCandidate, ProtectionObject } from '../lib/types';
import { ResultCard } from './ResultCard';
import { Shield } from './Shield';

type Prefill = {
  type: AnalysisType;
  text?: string;
  imageUri?: string;
  imageMime?: string;
  autoStart?: boolean;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function validDraftDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function Analyzer({ prefill }: { prefill?: Prefill }) {
  const [value, setValue] = useState(prefill?.text || '');
  const [imageUri, setImageUri] = useState(prefill?.imageUri || '');
  const [imageMime, setImageMime] = useState(prefill?.imageMime || 'image/jpeg');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const sessionIdRef = useRef('');
  const [sessionId, setSessionId] = useState('');
  const [activeProtection, setActiveProtection] = useState<ProtectionObject | null>(null);
  const [protectionSaving, setProtectionSaving] = useState(false);
  const [protectionError, setProtectionError] = useState('');
  const [protectionDraft, setProtectionDraft] = useState<ProtectionCandidate | null>(null);
  const [protectionUsefulSent, setProtectionUsefulSent] = useState(false);
  const [deepVerificationInterested, setDeepVerificationInterested] = useState(false);

  async function ensureSessionId() {
    if (sessionIdRef.current) return sessionIdRef.current;

    const installId = await getInstallId();
    const nextSessionId = createSessionId(installId);
    sessionIdRef.current = nextSessionId;
    setSessionId(nextSessionId);
    return nextSessionId;
  }

  useEffect(() => {
    let active = true;

    void ensureSessionId()
      .then(id => {
        if (!active) return;
        void sendTelemetry({
          event: 'page_view',
          sessionId: id,
        }).catch(() => {});
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadProtection()
      .then(async protection => {
        if (!active) return;
        setActiveProtection(protection);
        if (protection) {
          const id = await ensureSessionId();
          void sendTelemetry({ event: 'protection_status_view', sessionId: id }).catch(() => {});
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const analysisType: AnalysisType = imageUri ? 'image' : looksLikeUrl(value) ? 'link' : 'text';

  const canSubmit = useMemo(
    () => Boolean(imageUri) || value.trim().length >= 3,
    [imageUri, value],
  );

  const isSharedPrefill = Boolean(prefill && (imageUri || value.trim()));

  const deepVerification = useMemo(
    () => result ? deriveDeepVerification(result) : { eligible: false, reason: '' },
    [result],
  );



  useEffect(() => {
    const candidate = result?.protectionCandidate;
    setProtectionDraft(candidate?.eligible ? { ...candidate } : null);
    setProtectionError('');
  }, [result]);

  useEffect(() => {
    setDeepVerificationInterested(false);
    if (!result || !deepVerification.eligible) return;
    void ensureSessionId().then(id => sendTelemetry({ event: 'deep_verification_eligible', sessionId: id, analysisType })).catch(() => {});
  }, [result, deepVerification.eligible]);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.82,
    });

    if (!res.canceled) {
      setValue('');
      setImageUri(res.assets[0].uri);
      setImageMime(res.assets[0].mimeType || 'image/jpeg');
      setResult(null);
      setError('');
    }
  }

  async function buildPayload() {
    const payload: any = { type: analysisType };

    if (analysisType === 'image') {
      payload.imageData = await uriToDataUrl(imageUri, imageMime);
    } else {
      payload.content = analysisType === 'link' ? normalizeUrl(value) : value.trim();
    }

    return payload;
  }

  async function run() {
    if (!canSubmit || loading) return;

    const startedAt = Date.now();

    setLoading(true);
    setRetrying(false);
    setError('');
    setResult(null);

    try {
      const activeSessionId = await ensureSessionId();

      // Telemetry hiçbir zaman ana analiz akışını bloklamaz.
      void sendTelemetry({
        event: 'analysis_started',
        sessionId: activeSessionId,
        analysisType,
      }).catch(() => {});

      const payload = await buildPayload();
      let analysisResult: AnalysisResult;

      try {
        analysisResult = await analyze(payload);
      } catch (firstError) {
        // Geçici ağ / ilk istek hataları için yalnızca bir kez sessizce yeniden dene.
        setRetrying(true);
        await wait(700);
        analysisResult = await analyze(payload);
      }

      setResult(analysisResult);

      const meta = (analysisResult as any).meta;
      void sendTelemetry({
        event: 'analysis_completed',
        sessionId: sessionIdRef.current,
        analysisType,
        score: analysisResult.score,
        level: analysisResult.level,
        route: typeof meta?.route === 'string' ? meta.route : undefined,
        latencyMs: Date.now() - startedAt,
      }).catch(() => {});
    } catch (e) {
      void sendTelemetry({
        event: 'analysis_error',
        sessionId: sessionIdRef.current,
        analysisType,
        latencyMs: Date.now() - startedAt,
      }).catch(() => {});

      setError(
        e instanceof Error
          ? e.message
          : 'Analiz şu anda tamamlanamadı. İnternet bağlantını kontrol edip tekrar dene.',
      );
    } finally {
      setRetrying(false);
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError('');
    setValue('');
    setImageUri('');
  }

  async function saveCurrentProtection() {
    if (!protectionDraft?.eligible || protectionSaving) return;
    setProtectionError('');
    if (!validDraftDate(protectionDraft.deadline)) {
      setProtectionError('Kritik tarih YYYY-AA-GG biçiminde geçerli bir tarih olmalı.');
      return;
    }
    setProtectionSaving(true);
    const id = await ensureSessionId().catch(() => '');
    if (id) void sendTelemetry({ event: 'protection_save_intent', sessionId: id, analysisType }).catch(() => {});
    try {
      const object = await saveProtection(protectionDraft);
      if (activeProtection) void sendTelemetry({ event: 'repeat_protection', sessionId: id, analysisType }).catch(() => {});
      setActiveProtection(object);
      setProtectionDraft({ ...object });
      setProtectionUsefulSent(false);
      if (id) void sendTelemetry({ event: 'protection_saved', sessionId: id, analysisType }).catch(() => {});
    } catch (error) {
      setProtectionError(error instanceof Error ? error.message : 'Koruma kaydı oluşturulamadı.');
    } finally {
      setProtectionSaving(false);
    }
  }

  async function removeActiveProtection() {
    await clearProtection().catch(() => {});
    setActiveProtection(null);
    setProtectionUsefulSent(false);
    const id = await ensureSessionId().catch(() => '');
    if (id) void sendTelemetry({ event: 'protection_removed', sessionId: id }).catch(() => {});
  }

  const currentCandidateSaved = Boolean(
    activeProtection && protectionDraft?.eligible &&
    activeProtection.title === protectionDraft.title &&
    activeProtection.provider === protectionDraft.provider &&
    activeProtection.nextAction === protectionDraft.nextAction &&
    activeProtection.deadline === protectionDraft.deadline,
  );

  const activeProtectionTiming = useMemo(
    () => activeProtection ? getProtectionTiming(activeProtection.deadline) : null,
    [activeProtection?.deadline],
  );

  async function markProtectionUseful() {
    if (protectionUsefulSent || !activeProtection) return;
    setProtectionUsefulSent(true);
    const id = await ensureSessionId().catch(() => '');
    if (id) void sendTelemetry({ event: 'protection_event_useful', sessionId: id }).catch(() => {});
  }

  async function markDeepVerificationInterest() {
    if (deepVerificationInterested || !deepVerification.eligible) return;
    setDeepVerificationInterested(true);
    const id = await ensureSessionId().catch(() => '');
    if (id) void sendTelemetry({ event: 'deep_verification_interest', sessionId: id, analysisType }).catch(() => {});
  }

  const ctaLabel = !canSubmit
    ? 'Mesaj, link veya ekran görüntüsü ekle'
    : isSharedPrefill
      ? 'Paylaşılan içeriği kontrol et'
      : 'Kontrol et';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.wrap}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Shield size={48} />
          <View>
            <Text style={styles.brandName}>GüvenCheck</Text>
            <Text style={styles.brandSub}>Dijital risk kontrolü</Text>
          </View>
        </View>

        {activeProtection && !result && (
          <View style={styles.protectionCard}>
            <Text style={styles.protectionKicker}>KORUMA AKTİF</Text>
            <Text style={styles.protectionTitle}>{activeProtection.title || 'Korunan taahhüt'}</Text>
            {!!activeProtection.provider && <Text style={styles.protectionText}>Sağlayıcı: {activeProtection.provider}</Text>}
            {!!activeProtection.deadline && <Text style={styles.protectionText}>Kritik tarih: {activeProtection.deadline}</Text>}
            {activeProtectionTiming && <Text style={styles.protectionTiming}>{activeProtectionTiming.label}</Text>}
            <Text style={styles.protectionText}>Sıradaki aksiyon: {activeProtection.nextAction}</Text>
            {activeProtectionTiming && ['today', 'soon', 'overdue'].includes(activeProtectionTiming.state) && (
              <Pressable onPress={markProtectionUseful} disabled={protectionUsefulSent} style={[styles.protectionUseful, protectionUsefulSent && styles.protectionUsefulDone]}>
                <Text style={styles.protectionUsefulText}>{protectionUsefulSent ? 'Geri bildirim alındı' : 'Bu hatırlatma işime yaradı'}</Text>
              </Pressable>
            )}
            <Pressable onPress={removeActiveProtection} style={styles.protectionRemove}>
              <Text style={styles.protectionRemoveText}>Koruma kaydını kaldır</Text>
            </Pressable>
          </View>
        )}

        {!result && (
          <>
            <Text style={styles.hero}>Şüpheli bir şey mi var?</Text>
            <Text style={styles.sub}>
              Şüpheli dijital içeriği tek yerden gönder. Mesaj, link veya ekran görüntüsü fark etmez;
              GüvenCheck uygun kontrol yolunu kendi seçer.
            </Text>

            <TextInput
              value={value}
              onChangeText={(text) => { setValue(text); setImageUri(''); setImageMime('image/jpeg'); }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Şüpheli mesajı, linki, teklif veya taahhüt metnini buraya yapıştır..."
              placeholderTextColor="#69857C"
              style={[styles.input, { minHeight: 150, textAlignVertical: 'top' }]}
            />

            <Pressable onPress={pickImage} style={styles.upload}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  <View style={styles.changeImageBadge}>
                    <Text style={styles.changeImageText}>Değiştirmek için dokun</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.uploadIcon}>▧</Text>
                  <Text style={styles.uploadTitle}>Ekran görüntüsü ekle</Text>
                  <Text style={styles.uploadSub}>İstersen screenshot ekle; sistem içerik türünü kendi seçer.</Text>
                </>
              )}
            </Pressable>

            {!!imageUri && (
              <Pressable onPress={() => { setImageUri(''); setImageMime('image/jpeg'); }} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Görseli kaldır</Text>
              </Pressable>
            )}

            <Pressable
              onPress={run}
              disabled={!canSubmit || loading}
              style={[
                styles.cta,
                (!canSubmit || loading) && styles.ctaDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#E9FFF6" />
              ) : (
                <Text style={styles.ctaText}>{ctaLabel}</Text>
              )}
            </Pressable>

            {loading && (
              <Text style={styles.loadingText}>
                {retrying
                  ? 'Bağlantı yenileniyor, analiz tekrar deneniyor…'
                  : 'İçerik okunuyor ve risk sinyalleri karşılaştırılıyor…'}
              </Text>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Analiz tamamlanamadı</Text>
                <Text style={styles.error}>{error}</Text>
                <Pressable
                  onPress={run}
                  disabled={!canSubmit || loading}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Tekrar dene</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.privacy}>
              🔒 Gönderdiğin içerik GüvenCheck veritabanında saklanmaz.
            </Text>
          </>
        )}

        {result && <ResultCard result={result} analysisType={analysisType} sessionId={sessionId} onReset={reset} />}

        {deepVerification.eligible && (
          <View style={styles.protectionCard}>
            <Text style={styles.protectionKicker}>DAHA DERİN DOĞRULAMA</Text>
            <Text style={styles.protectionTitle}>Bu vakada ek kanıtlar anlamlı olabilir</Text>
            <Text style={styles.protectionText}>{deepVerification.reason}</Text>
            <Text style={styles.protectionText}>Bu buton ödeme veya sipariş başlatmaz; yalnız ilgiyi ölçer.</Text>
            <Pressable onPress={markDeepVerificationInterest} disabled={deepVerificationInterested} style={[styles.protectionUseful, deepVerificationInterested && styles.protectionUsefulDone]}>
              <Text style={styles.protectionUsefulText}>{deepVerificationInterested ? 'İlgin kaydedildi' : 'Daha derin doğrulamayla ilgileniyorum'}</Text>
            </Pressable>
          </View>
        )}

        {protectionDraft?.eligible && (
          <View style={styles.protectionCard}>
            <Text style={styles.protectionKicker}>KORUMA ADAYI</Text>
            <Text style={styles.protectionText}>Kaydetmeden önce alanları kontrol edip düzeltebilirsin.</Text>
            <Text style={styles.protectionFieldLabel}>Başlık</Text>
            <TextInput value={protectionDraft.title} onChangeText={(title) => setProtectionDraft(d => d ? { ...d, title } : d)} style={styles.protectionInput} />
            <Text style={styles.protectionFieldLabel}>Sağlayıcı</Text>
            <TextInput value={protectionDraft.provider} onChangeText={(provider) => setProtectionDraft(d => d ? { ...d, provider } : d)} style={styles.protectionInput} />
            <Text style={styles.protectionFieldLabel}>Kritik tarih (opsiyonel)</Text>
            <TextInput value={protectionDraft.deadline} onChangeText={(deadline) => setProtectionDraft(d => d ? { ...d, deadline } : d)} placeholder="YYYY-AA-GG" placeholderTextColor="#69857C" autoCapitalize="none" style={styles.protectionInput} />
            <Text style={styles.protectionFieldLabel}>Sıradaki aksiyon</Text>
            <TextInput value={protectionDraft.nextAction} onChangeText={(nextAction) => setProtectionDraft(d => d ? { ...d, nextAction } : d)} multiline style={[styles.protectionInput, styles.protectionInputMultiline]} />
            <Text style={styles.protectionText}>{protectionDraft.summary}</Text>
            <Text style={styles.protectionText}>Yalnız bu yapılandırılmış özet cihazında saklanır; gönderdiğin ham içerik kaydedilmez.</Text>
            <Pressable onPress={saveCurrentProtection} disabled={protectionSaving || currentCandidateSaved} style={[styles.cta, (protectionSaving || currentCandidateSaved) && styles.ctaDisabled]}>
              {protectionSaving ? <ActivityIndicator color="#E9FFF6" /> : <Text style={styles.ctaText}>{currentCandidateSaved ? 'Koruma aktif' : activeProtection ? 'Aktif korumayı bununla değiştir' : 'Korumaya al'}</Text>}
            </Pressable>
            {!!protectionError && <Text style={styles.error}>{protectionError}</Text>}
          </View>
        )}

        <View style={styles.footerBranding}>
          <Text style={styles.footer}>
            Göndermeden. Ödemeden. Tıklamadan önce.
          </Text>
          <Text style={styles.footerBrand}>GüvenCheck · Karaaslan Labs</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 42,
    backgroundColor: '#071D18',
    minHeight: '100%',
    gap: 16,
  },
  brand: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  brandName: {
    color: '#F7FFF9',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  brandSub: {
    color: '#9BB7AD',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  hero: {
    color: '#F8FFFB',
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '900',
    marginTop: 18,
  },
  sub: {
    color: '#9BB9AF',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0A251F',
    borderWidth: 1,
    borderColor: '#143D33',
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#124636',
    borderWidth: 1,
    borderColor: '#1B6A4D',
  },
  tabText: {
    color: '#73978B',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#F6FFF9',
    fontWeight: '900',
  },
  protectionCard: {
    backgroundColor: '#0B2A22', borderWidth: 1, borderColor: '#2D6B57', borderRadius: 18, padding: 16, gap: 8,
  },
  protectionKicker: { color: '#69D4A5', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  protectionTitle: { color: '#F4FFF9', fontSize: 18, fontWeight: '900' },
  protectionText: { color: '#C7DDD5', fontSize: 13, lineHeight: 19 },
  protectionTiming: { color: '#69D4A5', fontSize: 14, lineHeight: 20, fontWeight: '900' },
  protectionUseful: { alignSelf: 'flex-start', backgroundColor: '#123A30', borderWidth: 1, borderColor: '#2D6B57', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 3 },
  protectionUsefulDone: { opacity: 0.65 },
  protectionUsefulText: { color: '#E6FFF4', fontSize: 12, fontWeight: '800' },
  protectionFieldLabel: { color: '#8FB5A7', fontSize: 11, fontWeight: '800', marginTop: 4 },
  protectionInput: { backgroundColor: '#071F19', borderWidth: 1, borderColor: '#315F51', borderRadius: 11, color: '#F4FFF9', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  protectionInputMultiline: { minHeight: 76, textAlignVertical: 'top' },
  protectionRemove: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#477B6B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 3 },
  protectionRemoveText: { color: '#DDF5EB', fontSize: 12, fontWeight: '800' },
  upload: {
    minHeight: 190,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2B7258',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0A241E',
  },
  uploadIcon: {
    fontSize: 34,
    color: '#5FD19F',
  },
  uploadTitle: {
    color: '#F0FFF8',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  uploadSub: {
    color: '#69D4A5',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  preview: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
    backgroundColor: '#051511',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(5,21,17,.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  changeImageText: {
    color: '#BDE8D6',
    fontSize: 11,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#0A241E',
    borderWidth: 1,
    borderColor: '#285A4B',
    borderRadius: 18,
    color: '#F5FFF9',
    padding: 16,
    fontSize: 16,
    minHeight: 58,
  },
  cta: {
    backgroundColor: '#18C77A',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#123A30',
  },
  ctaText: {
    color: '#F4FFF9',
    fontWeight: '900',
    fontSize: 15,
    textAlign: 'center',
  },
  loadingText: {
    color: '#82A99C',
    fontSize: 12,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#321817',
    borderWidth: 1,
    borderColor: '#6E3531',
    padding: 14,
    borderRadius: 14,
    gap: 7,
  },
  errorTitle: {
    color: '#FFD1CC',
    fontSize: 13,
    fontWeight: '900',
  },
  error: {
    color: '#FFB6B6',
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#8D4D47',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 3,
  },
  retryButtonText: {
    color: '#FFE6E2',
    fontSize: 12,
    fontWeight: '900',
  },
  privacy: {
    color: '#91B2A6',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerBranding: {
    marginTop: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footer: {
    color: '#57756B',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  footerBrand: {
    marginTop: 8,
    color: '#5FD19F',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
