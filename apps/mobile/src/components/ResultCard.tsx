import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AnalysisResult, AnalysisType } from '../lib/types';
import { sendFeedback, sendTelemetry } from '../lib/api';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Shield } from './Shield';

const labels = {
  high: 'Yüksek risk',
  medium: 'Dikkatli ol',
  low: 'Belirgin risk sinyali bulunmadı',
} as const;

const levelAdvice = {
  high: 'İşlemi durdur ve ilgili kurumun resmî kanalından bağımsız doğrula.',
  medium: 'İşlem yapmadan önce göndereni ve bağlantıyı bağımsız doğrula.',
  low: 'Belirgin risk görünmüyor; yine de hassas işlem öncesi resmî kanalı kullan.',
} as const;

const riskPalette = {
  high: {
    accent: '#FF8A86',
    soft: '#3A211F',
    border: '#6A3936',
  },
  medium: {
    accent: '#F3C76B',
    soft: '#342D1C',
    border: '#67562E',
  },
  low: {
    accent: '#62DFA6',
    soft: '#123A30',
    border: '#315F51',
  },
} as const;

type NegativeFeedbackReason =
  | 'fazla_supheci'
  | 'riski_az_gosterdi'
  | 'anlasilmadi'
  | 'diger';

const negativeFeedbackReasons: Array<{
  key: NegativeFeedbackReason;
  label: string;
}> = [
  { key: 'fazla_supheci', label: 'Fazla şüpheciydi' },
  { key: 'riski_az_gosterdi', label: 'Riski az gösterdi' },
  { key: 'anlasilmadi', label: 'Açıklama anlaşılmadı' },
  { key: 'diger', label: 'Diğer' },
];

export function ResultCard({
  result,
  analysisType,
  sessionId,
  onReset,
}: {
  result: AnalysisResult;
  analysisType: AnalysisType;
  sessionId: string;
  onReset: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [showNegativeReasons, setShowNegativeReasons] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [shareSending, setShareSending] = useState(false);
  const [shareError, setShareError] = useState('');
  const shareCardRef = useRef<View>(null);
  const palette = riskPalette[result.level];

  const extraActions = (result.actions || []).slice(1);
  const extraSignals = (result.signals || []).slice(3);

  async function submitFeedback(helpful: boolean, reason?: NegativeFeedbackReason) {
    if (feedbackSending || feedback) return;

    setFeedbackSending(true);
    setFeedbackError('');

    try {
      const meta = (result as any).meta;
      await sendFeedback({
        helpful,
        reason: helpful ? 'dogru' : reason,
        analysisType,
        score: result.score,
        level: result.level,
        route: typeof meta?.route === 'string' ? meta.route : undefined,
        requestId:
          typeof (result as any).requestId === 'string'
            ? (result as any).requestId
            : undefined,
        sessionId,
      });
      setFeedback(helpful ? 'yes' : 'no');
      setShowNegativeReasons(false);
    } catch (error) {
      setFeedbackError(
        error instanceof Error
          ? error.message
          : 'Geri bildirim gönderilemedi. Tekrar deneyebilirsin.',
      );
    } finally {
      setFeedbackSending(false);
    }
  }

  async function shareResult() {
    if (shareSending) return;

    setShareSending(true);
    setShareError('');

    // Android'de gerçek gönderim sonucu güvenilir biçimde ayrılamadığı için
    // telemetry burada "paylaşım akışı başlatıldı" anlamına gelir.
    const meta = (result as any).meta;
    void sendTelemetry({
      event: 'share_clicked',
      sessionId,
      analysisType,
      score: result.score,
      level: result.level,
      route: typeof meta?.route === 'string' ? meta.route : undefined,
    }).catch(() => {});

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error('Bu cihazda sistem paylaşımı kullanılamıyor.');
      }

      if (!shareCardRef.current) {
        throw new Error('Paylaşım kartı hazırlanamadı.');
      }

      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 1080,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'GüvenCheck sonucunu paylaş',
        UTI: 'public.png',
      });
    } catch (error) {
      setShareError(
        error instanceof Error
          ? error.message
          : 'Paylaşım ekranı açılamadı. Tekrar deneyebilirsin.',
      );
    } finally {
      setShareSending(false);
    }
  }

  return (
    <>
      <View
        ref={shareCardRef}
        collapsable={false}
        style={styles.shareCaptureHost}
      >
        <View style={styles.shareCard}>
          <View style={styles.shareBrandRow}>
            <Shield size={48} />
            <View>
              <Text style={styles.shareBrand}>GüvenCheck</Text>
              <Text style={styles.shareBrandSub}>Dijital risk kontrolü</Text>
            </View>
          </View>

          <View style={styles.shareDivider} />

          <Text style={styles.shareKicker}>GÜVENCHECK SONUCU</Text>

          <View style={styles.shareHeadingRow}>
            <Text style={[styles.shareTitle, { color: palette.accent }]}>
              {labels[result.level]}
            </Text>
            <View
              style={[
                styles.shareScoreBadge,
                { borderColor: palette.border, backgroundColor: palette.soft },
              ]}
            >
              <Text style={styles.shareScoreBig}>{result.score}</Text>
              <Text style={styles.shareScoreOutOf}>/100</Text>
            </View>
          </View>

          <View
            style={[
              styles.shareAction,
              { borderColor: palette.border, backgroundColor: palette.soft },
            ]}
          >
            <Text style={[styles.shareActionLabel, { color: palette.accent }]}>
              ŞİMDİ YAP
            </Text>
            <Text style={styles.shareActionText}>
              {result.actions?.[0] || levelAdvice[result.level]}
            </Text>
          </View>

          <Text style={styles.shareWhy}>Neden?</Text>
          {(result.signals || []).slice(0, 2).map((signal, index) => (
            <Text key={`share-${index}`} style={styles.shareBullet}>
              • {signal}
            </Text>
          ))}

          {result.level === 'low' && (
            <Text style={styles.shareCaveat}>
              Belirgin risk sinyali bulunmaması, içeriğin kesin olarak güvenli
              olduğu anlamına gelmez.
            </Text>
          )}

          <View style={styles.shareFooterBlock}>
            <Text style={styles.shareFooterBrand}>GüvenCheck · Karaaslan Labs</Text>
            <Text style={styles.shareFooterTagline}>
              Göndermeden. Ödemeden. Tıklamadan önce.
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { borderColor: palette.border }]}>
<Text style={styles.kicker}>GÜVENCHECK SONUCU</Text>

      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={[styles.title, { color: palette.accent }]}>
            {labels[result.level]}
          </Text>
        </View>

        <View
          style={[
            styles.scoreBadge,
            { borderColor: palette.border, backgroundColor: palette.soft },
          ]}
        >
          <Text style={styles.scoreBig}>{result.score}</Text>
          <Text style={styles.scoreOutOf}>/100</Text>
        </View>
      </View>

      <View
        style={[
          styles.action,
          { backgroundColor: palette.soft, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.actionLabel, { color: palette.accent }]}>
          ŞİMDİ YAP
        </Text>
        <Text style={styles.actionText}>
          {result.actions?.[0] || levelAdvice[result.level]}
        </Text>
      </View>

      {result.level === 'low' && (
        <Text style={styles.caveat}>
          Belirgin risk sinyali bulunmadı. Bu, içeriğin kesin olarak güvenli
          olduğu anlamına gelmez; hassas işlem öncesi resmî kanaldan doğrula.
        </Text>
      )}

      <Text style={styles.section}>Neden böyle düşünüyoruz?</Text>
      {(result.signals || []).slice(0, 3).map((s, i) => (
        <Text key={i} style={styles.bullet}>
          ✓ {s}
        </Text>
      ))}

      {(extraSignals.length > 0 || extraActions.length > 0) && (
        <Pressable
          onPress={() => setDetailsOpen(v => !v)}
          style={styles.expandButton}
        >
          <Text style={styles.expandText}>
            {detailsOpen ? 'Ayrıntıları gizle' : 'Ayrıntılı açıklamayı göster'}
          </Text>
          <Text style={styles.expandIcon}>{detailsOpen ? '−' : '+'}</Text>
        </Pressable>
      )}

      {detailsOpen && (
        <View style={styles.details}>
          {extraSignals.length > 0 && (
            <>
              <Text style={styles.detailsTitle}>Diğer sinyaller</Text>
              {extraSignals.map((s, i) => (
                <Text key={`signal-${i}`} style={styles.detailBullet}>
                  • {s}
                </Text>
              ))}
            </>
          )}

          {extraActions.length > 0 && (
            <>
              <Text style={styles.detailsTitle}>Diğer öneriler</Text>
              {extraActions.map((a, i) => (
                <Text key={`action-${i}`} style={styles.detailBullet}>
                  {i + 1}. {a}
                </Text>
              ))}
            </>
          )}
        </View>
      )}

      <View style={styles.feedbackBox}>
        <Text style={styles.feedbackTitle}>Bu sonuç işine yaradı mı?</Text>

        {feedback ? (
          <View style={styles.feedbackThanksWrap}>
            <Text style={styles.feedbackThanks}>
              Teşekkürler. Geri bildirimin sonuç kalitesini geliştirmemize yardımcı
              olur.
            </Text>
            <Text style={styles.feedbackBrand}>GüvenCheck · Karaaslan Labs</Text>
          </View>
        ) : showNegativeReasons ? (
          <View style={styles.feedbackReasonWrap}>
            <Text style={styles.feedbackReasonTitle}>Nesi iyi değildi?</Text>
            <View style={styles.feedbackReasonGrid}>
              {negativeFeedbackReasons.map(item => (
                <Pressable
                  key={item.key}
                  onPress={() => submitFeedback(false, item.key)}
                  disabled={feedbackSending}
                  style={[
                    styles.feedbackReasonButton,
                    feedbackSending && styles.feedbackButtonDisabled,
                  ]}
                >
                  <Text style={styles.feedbackReasonButtonText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowNegativeReasons(false)}
              disabled={feedbackSending}
              style={styles.feedbackReasonCancel}
            >
              <Text style={styles.feedbackReasonCancelText}>Geri dön</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.feedbackButtons}>
            <Pressable
              onPress={() => submitFeedback(true)}
              disabled={feedbackSending}
              style={[styles.feedbackButton, feedbackSending && styles.feedbackButtonDisabled]}
            >
              <Text style={styles.feedbackButtonText}>Evet</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowNegativeReasons(true)}
              disabled={feedbackSending}
              style={[styles.feedbackButton, feedbackSending && styles.feedbackButtonDisabled]}
            >
              <Text style={styles.feedbackButtonText}>Hayır</Text>
            </Pressable>
          </View>
        )}

        {feedbackSending && (
          <Text style={styles.feedbackStatus}>Gönderiliyor…</Text>
        )}

        {!!feedbackError && (
          <Text style={styles.feedbackError}>{feedbackError}</Text>
        )}
      </View>

      <Text style={styles.disclaimer}>
        GüvenCheck kesin bir dolandırıcılık kararı vermez; risk sinyallerini
        değerlendirir. Finansal veya hassas işlem yapmadan önce ilgili kurumu
        kendi resmî kanalından doğrula.
      </Text>

      {!!shareError && (
        <Text style={styles.shareError}>{shareError}</Text>
      )}

      <View style={styles.bottomButtons}>
        <Pressable style={styles.secondaryButton} onPress={onReset}>
          <Text style={styles.secondaryButtonText}>Yeni kontrol</Text>
        </Pressable>

        <Pressable
          style={[styles.shareButton, shareSending && styles.shareButtonDisabled]}
          onPress={shareResult}
          disabled={shareSending}
        >
          <Text style={styles.shareButtonText}>
            {shareSending ? 'Paylaşım açılıyor…' : 'Aileme gönder'}
          </Text>
        </Pressable>
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  shareCaptureHost: {
    position: 'absolute',
    left: -5000,
    top: 0,
    width: 420,
  },
  shareCard: {
    width: 420,
    backgroundColor: '#071F17',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 26,
    gap: 14,
  },
  shareBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareBrand: {
    color: '#F6FFF9',
    fontSize: 22,
    fontWeight: '900',
  },
  shareBrandSub: {
    color: '#9BB7AD',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  shareDivider: {
    height: 1,
    backgroundColor: '#1A4338',
  },
  shareKicker: {
    color: '#7BCFAE',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  shareHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  shareTitle: {
    flex: 1,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
  },
  shareScoreBadge: {
    minWidth: 86,
    height: 68,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  shareScoreBig: {
    color: '#F5FFF9',
    fontSize: 29,
    fontWeight: '900',
  },
  shareScoreOutOf: {
    color: '#93AFA5',
    fontSize: 11,
    marginTop: 9,
  },
  shareAction: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  shareActionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  shareActionText: {
    color: '#F5FFF9',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
    marginTop: 6,
  },
  shareWhy: {
    color: '#F5FFF9',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  shareBullet: {
    color: '#C9DDD5',
    fontSize: 13,
    lineHeight: 20,
  },
  shareCaveat: {
    color: '#C9DDD5',
    backgroundColor: '#0D2B24',
    borderWidth: 1,
    borderColor: '#315F51',
    borderRadius: 14,
    padding: 13,
    fontSize: 12,
    lineHeight: 18,
  },
  shareFooterBlock: {
    borderTopWidth: 1,
    borderTopColor: '#1A4338',
    paddingTop: 14,
    marginTop: 4,
    alignItems: 'center',
    gap: 4,
  },
  shareFooterBrand: {
    color: '#B7D4C9',
    fontSize: 11,
    fontWeight: '900',
  },
  shareFooterTagline: {
    color: '#89A99E',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#09271F',
    borderWidth: 1,
    borderColor: '#205A46',
    borderRadius: 26,
    padding: 22,
    gap: 12,
  },
  kicker: {
    color: '#67D3A5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  headingText: {
    flex: 1,
    gap: 7,
  },
  title: {
    color: '#F5FFFA',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  score: {
    color: '#A9C5BB',
    fontSize: 13,
  },
  scoreBadge: {
    minWidth: 78,
    height: 64,
    borderWidth: 1,
    borderColor: '#2A5549',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  scoreBig: {
    color: '#F2FFF8',
    fontSize: 25,
    fontWeight: '900',
  },
  scoreOutOf: {
    color: '#8EADA2',
    fontSize: 11,
    marginTop: 7,
  },
  action: {
    backgroundColor: '#10362C',
    borderWidth: 1,
    borderColor: '#315F51',
    borderRadius: 16,
    padding: 16,
    marginVertical: 2,
  },
  actionLabel: {
    color: '#65E0AC',
    fontSize: 11,
    fontWeight: '900',
  },
  actionText: {
    color: '#F4FFF9',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
    lineHeight: 22,
  },
  caveat: {
    color: '#AFC7BE',
    backgroundColor: '#102F28',
    borderWidth: 1,
    borderColor: '#244B40',
    borderRadius: 14,
    padding: 13,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    color: '#F4FFF9',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },
  bullet: {
    color: '#C9DED6',
    fontSize: 14,
    lineHeight: 21,
  },
  expandButton: {
    borderWidth: 1,
    borderColor: '#315A4F',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandText: {
    color: '#C6DDD4',
    fontSize: 13,
    fontWeight: '800',
  },
  expandIcon: {
    color: '#78B79D',
    fontSize: 22,
    fontWeight: '700',
  },
  details: {
    backgroundColor: '#0A241E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#21473C',
    padding: 14,
    gap: 7,
  },
  detailsTitle: {
    color: '#E9FFF6',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  detailBullet: {
    color: '#BFD7CE',
    fontSize: 13,
    lineHeight: 19,
  },
  feedbackBox: {
    borderWidth: 1,
    borderColor: '#315A4F',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  feedbackTitle: {
    color: '#F1FFF8',
    fontSize: 15,
    fontWeight: '900',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  feedbackButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#37665A',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#E8FFF5',
    fontWeight: '800',
  },
  feedbackThanksWrap: {
    gap: 7,
  },
  feedbackThanks: {
    color: '#9FC1B5',
    fontSize: 12,
    lineHeight: 18,
  },
  feedbackBrand: {
    color: '#557A6D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  feedbackReasonWrap: {
    gap: 10,
  },
  feedbackReasonTitle: {
    color: '#DCEDE6',
    fontSize: 13,
    fontWeight: '800',
  },
  feedbackReasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackReasonButton: {
    width: '48%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#315F51',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#0C2C24',
  },
  feedbackReasonButtonText: {
    color: '#E8F7F0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackReasonCancel: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
  },
  feedbackReasonCancelText: {
    color: '#8FB5A7',
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackButtonDisabled: {
    opacity: 0.55,
  },
  feedbackStatus: {
    color: '#A9C5BB',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackError: {
    color: '#FF9C98',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },
  disclaimer: {
    color: '#6F9286',
    fontSize: 11,
    lineHeight: 17,
    borderTopWidth: 1,
    borderTopColor: '#23463C',
    paddingTop: 14,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  secondaryButton: {
    flex: 0.85,
    borderWidth: 1,
    borderColor: '#37665A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E8FFF5',
    fontWeight: '800',
    fontSize: 13,
  },
  shareButton: {
    flex: 1.15,
    backgroundColor: '#54DFA0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.65,
  },
  shareError: {
    color: '#FF9C98',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  shareButtonText: {
    color: '#062118',
    fontWeight: '900',
    fontSize: 13,
  },
});
