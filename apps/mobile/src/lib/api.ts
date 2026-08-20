import type { AnalysisResult, AnalysisType } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://guvencheck.vercel.app';

export async function analyze(input: { type: AnalysisType; content?: string; imageData?: string }, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-GuvenCheck-Client': 'mobile-alpha' },
    body: JSON.stringify(input),
    signal
  });
  const data = await response.json();
  if (!response.ok) {
    const suffix = data?.requestId ? ` (Kod: ${data.requestId})` : '';
    throw new Error(`${data?.error || 'Analiz sırasında hata oluştu.'}${suffix}`);
  }
  return data as AnalysisResult;
}

export type FeedbackInput = {
  helpful: boolean;
  reason?: 'dogru' | 'fazla_supheci' | 'riski_az_gosterdi' | 'anlasilmadi' | 'diger';
  analysisType?: AnalysisType;
  score?: number;
  level?: 'low' | 'medium' | 'high';
  route?: string;
  requestId?: string;
  sessionId?: string;
};

export async function sendFeedback(input: FeedbackInput, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GuvenCheck-Client': 'mobile-alpha',
    },
    body: JSON.stringify(input),
    signal,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // JSON olmayan hata yanıtını da kontrollü ele al.
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Geri bildirim gönderilemedi.');
  }

  return data as { ok: true };
}

export type TelemetryEvent =
  | 'page_view'
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_error'
  | 'share_clicked'
  | 'privacy_view';

export type TelemetryInput = {
  event: TelemetryEvent;
  sessionId?: string;
  analysisType?: AnalysisType;
  score?: number;
  level?: 'low' | 'medium' | 'high';
  route?: string;
  latencyMs?: number;
};

export async function sendTelemetry(input: TelemetryInput, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE}/api/telemetry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GuvenCheck-Client': 'mobile-alpha',
    },
    body: JSON.stringify(input),
    signal,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Telemetry ürün akışını bozmamalı.
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Telemetry kaydedilemedi.');
  }

  return data as { ok: true };
}

