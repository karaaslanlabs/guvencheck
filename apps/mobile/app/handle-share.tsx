import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import { Analyzer } from '@/src/components/Analyzer';
import { looksLikeUrl } from '@/src/lib/url';
import type { AnalysisType } from '@/src/lib/types';

type Prefill = {
  type: AnalysisType;
  text?: string;
  imageUri?: string;
  imageMime?: string;
  autoStart?: boolean;
};

export default function HandleShare() {
  const {
    resolvedSharedPayloads,
    isResolving,
    error,
    clearSharedPayloads,
  } = useIncomingShare();

  const [consumed, setConsumed] = useState(false);

  const prefill = useMemo<Prefill | undefined>(() => {
    const payload = resolvedSharedPayloads[0];
    if (!payload) return undefined;

    if (payload.contentType === 'image' && payload.contentUri) {
      return {
        type: 'image',
        imageUri: payload.contentUri,
        imageMime: payload.contentMimeType || 'image/jpeg',
        // Paylaşım uygulamayı açsın ama kullanıcı onayı olmadan analizi başlatmasın.
        autoStart: false,
      };
    }

    // Website payloadlarında URI, varsa paylaşılan başlık/metinden daha güvenilir
    // analiz girdisidir. Bu kontrolü generic value'dan önce yapıyoruz.
    if (payload.contentType === 'website' && payload.contentUri) {
      return {
        type: 'link',
        text: payload.contentUri,
        autoStart: false,
      };
    }

    const anyPayload = payload as any;
    const text = String(anyPayload.value || '').trim();

    if (text) {
      return {
        type: looksLikeUrl(text) ? 'link' : 'text',
        text,
        autoStart: false,
      };
    }

    return undefined;
  }, [resolvedSharedPayloads]);

  useEffect(() => {
    if (!prefill || consumed) return;

    setConsumed(true);
    const timer = setTimeout(() => {
      clearSharedPayloads();
    }, 1500);

    return () => clearTimeout(timer);
  }, [prefill, consumed, clearSharedPayloads]);

  if (isResolving) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#38C98B" />
        <Text style={styles.text}>Paylaşılan içerik hazırlanıyor…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Paylaşılan içerik alınamadı</Text>
        <Text style={styles.text}>
          İçeriği yeniden paylaşmayı deneyebilir veya GüvenCheck ana ekranından
          manuel olarak kontrol edebilirsin.
        </Text>
        <Pressable style={styles.homeButton} onPress={() => router.replace('/')}>
          <Text style={styles.homeButtonText}>Ana ekrana dön</Text>
        </Pressable>
      </View>
    );
  }

  if (!prefill) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Paylaşılan içerik bulunamadı</Text>
        <Text style={styles.text}>
          GüvenCheck'i normal şekilde açıp ekran görüntüsü, mesaj veya link
          seçebilirsin.
        </Text>
        <Pressable style={styles.homeButton} onPress={() => router.replace('/')}>
          <Text style={styles.homeButtonText}>Ana ekrana dön</Text>
        </Pressable>
      </View>
    );
  }

  return <Analyzer prefill={prefill} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#071D18',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  text: {
    color: '#B9D4CA',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    color: '#F4FFF9',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  homeButton: {
    marginTop: 8,
    backgroundColor: '#123B30',
    borderWidth: 1,
    borderColor: '#315F51',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  homeButtonText: {
    color: '#EFFFF7',
    fontWeight: '900',
  },
});
