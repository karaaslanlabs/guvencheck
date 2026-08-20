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
import { normalizeUrl } from '../lib/url';
import { createSessionId, getInstallId } from '../lib/install-id';
import type { AnalysisResult, AnalysisType } from '../lib/types';
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

export function Analyzer({ prefill }: { prefill?: Prefill }) {
  const [type, setType] = useState<AnalysisType>(prefill?.type || 'image');
  const [value, setValue] = useState(prefill?.text || '');
  const [imageUri, setImageUri] = useState(prefill?.imageUri || '');
  const [imageMime, setImageMime] = useState(prefill?.imageMime || 'image/jpeg');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const sessionIdRef = useRef('');
  const [sessionId, setSessionId] = useState('');

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

  const canSubmit = useMemo(
    () =>
      type === 'image'
        ? Boolean(imageUri)
        : type === 'link'
          ? Boolean(normalizeUrl(value))
          : value.trim().length >= 3,
    [type, imageUri, value],
  );

  const isSharedPrefill = Boolean(
    prefill && (
      (type === 'image' && imageUri) ||
      (type !== 'image' && value.trim())
    ),
  );

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.82,
    });

    if (!res.canceled) {
      setType('image');
      setImageUri(res.assets[0].uri);
      setImageMime(res.assets[0].mimeType || 'image/jpeg');
      setResult(null);
      setError('');
    }
  }

  async function buildPayload() {
    const payload: any = { type };

    if (type === 'image') {
      payload.imageData = await uriToDataUrl(imageUri, imageMime);
    } else {
      payload.content = type === 'link' ? normalizeUrl(value) : value.trim();
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
        analysisType: type,
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
        analysisType: type,
        score: analysisResult.score,
        level: analysisResult.level,
        route: typeof meta?.route === 'string' ? meta.route : undefined,
        latencyMs: Date.now() - startedAt,
      }).catch(() => {});
    } catch (e) {
      void sendTelemetry({
        event: 'analysis_error',
        sessionId: sessionIdRef.current,
        analysisType: type,
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
    setType('image');
  }

  function selectType(nextType: AnalysisType) {
    setType(nextType);
    setResult(null);
    setError('');
  }

  const ctaLabel = !canSubmit
    ? type === 'image'
      ? 'Önce ekran görüntüsü seç'
      : type === 'text'
        ? 'Önce mesajı yapıştır'
        : 'Önce linki gir'
    : isSharedPrefill
      ? type === 'image'
        ? 'Paylaşılan ekran görüntüsünü kontrol et'
        : type === 'link'
          ? 'Paylaşılan linki kontrol et'
          : 'Paylaşılan mesajı kontrol et'
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

        {!result && (
          <>
            <Text style={styles.hero}>Şüpheli bir şey mi var?</Text>
            <Text style={styles.sub}>
              Mesajı, linki veya ekran görüntüsünü kontrol et. Risk seviyesini
              ve ne yapman gerektiğini sade Türkçeyle gör.
            </Text>

            <View style={styles.tabs}>
              {(['image', 'text', 'link'] as AnalysisType[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => selectType(t)}
                  style={[styles.tab, type === t && styles.tabActive]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      type === t && styles.tabTextActive,
                    ]}
                  >
                    {t === 'image'
                      ? 'Ekran görüntüsü'
                      : t === 'text'
                        ? 'Mesaj'
                        : 'Link'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {type === 'image' ? (
              <Pressable onPress={pickImage} style={styles.upload}>
                {imageUri ? (
                  <>
                    <Image source={{ uri: imageUri }} style={styles.preview} />
                    <View style={styles.changeImageBadge}>
                      <Text style={styles.changeImageText}>
                        Değiştirmek için dokun
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.uploadIcon}>▧</Text>
                    <Text style={styles.uploadTitle}>Ekran görüntüsü seç</Text>
                    <Text style={styles.uploadSub}>
                      SMS, WhatsApp, e-posta veya ilan ekranı
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
              <TextInput
                value={value}
                onChangeText={setValue}
                multiline={type === 'text'}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={
                  type === 'text'
                    ? 'Şüpheli mesajı buraya yapıştır...'
                    : 'ornek.com'
                }
                placeholderTextColor="#69857C"
                style={[
                  styles.input,
                  type === 'text' && {
                    minHeight: 150,
                    textAlignVertical: 'top',
                  },
                ]}
              />
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

        {result && <ResultCard result={result} analysisType={type} sessionId={sessionId} onReset={reset} />}

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
