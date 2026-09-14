"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MANIPULATION_LABELS, type ManipulationTactic } from "../lib/manipulation-lens";
import { sanitizeProtectionCandidate, type ProtectionCandidate, type ProtectionObject } from "../lib/commitment-protection";
import { getProtectionTiming } from "../lib/protection-status";
import { deriveDeepVerification } from "../lib/deep-verification";
import { getProtectionBooster } from "../lib/protection-booster";

type RiskLevel = "low" | "medium" | "high";
type Analysis = {
  requestId?: string;
  score: number;
  level: RiskLevel;
  title: string;
  summary: string;
  signals: string[];
  manipulationTactics?: ManipulationTactic[];
  manipulationSummary?: string;
  protectionCandidate?: ProtectionCandidate;
  actions: string[];
  avoid: string[];
  confidence: "low" | "medium" | "high";
  verificationStatus?: "not_checked" | "checked_no_strong_signal" | "checked_mixed" | "checked_risk_signals";
  verificationSummary?: string;
  verifiedFindings?: string[];
  sources?: Array<{ title: string; url: string }>;
  webVerified?: boolean;
  mode?: "ai" | "demo";
  decisionSupport?: {
    uncertainty: "low" | "medium" | "high";
    uncertaintySummary: string;
    implication: string;
    nextAction: string;
  };
  meta?: {
    version?: string;
    model?: string;
    inputTokens?: number | null;
    cachedInputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    webSearchCalls?: number;
    latencyMs?: number;
    estimatedCostUsd?: number | null;
    route?: string;
    escalated?: boolean;
    firstPassScore?: number;
    escalationReasons?: string[];
    calls?: Array<{ model?: string; costUsd?: number | null; latencyMs?: number; webSearchCalls?: number }>;
  };
};

const levelText: Record<RiskLevel, string> = {
  low: "Belirgin risk sinyali bulunmadı",
  medium: "Dikkatli ol",
  high: "Yüksek risk",
};

const shortLevelText: Record<RiskLevel, string> = {
  low: "Düşük risk",
  medium: "Dikkatli ol",
  high: "Yüksek risk",
};

const uncertaintyText = { low: "Düşük", medium: "Orta", high: "Yüksek" } as const;

function validDraftDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function validUrl(value: string) {
  return Boolean(normalizeUrl(value));
}

function sourceLabel(url: string, targetUrl?: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const targetHost = targetUrl && validUrl(targetUrl) ? new URL(targetUrl).hostname.replace(/^www\./, "").toLowerCase() : "";
    if (targetHost && (host === targetHost || host.endsWith(`.${targetHost}`))) return "Hedef site";
    if (host === "sikayetvar.com" || host.endsWith(".sikayetvar.com")) return "Kullanıcı bildirimleri";
    if (host.endsWith(".gov.tr") || host === "gov.tr") return "Resmî kaynak";
    return "Harici kaynak";
  } catch {
    return "Kaynak";
  }
}

async function compressImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
    throw new Error("Şimdilik JPG, PNG veya WEBP ekran görüntüsü kullan.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Görsel en fazla 12 MB olabilir.");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Görsel okunamadı."));
    });

    const maxSide = 1800;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Görsel işlenemedi.");
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function createShareCard(analysis: Analysis, appUrl?: string): Promise<File | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#12372a");
  bg.addColorStop(1, "#06100c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const shareLogo = new Image();
  shareLogo.decoding = "async";
  shareLogo.src = "/brand/guvencheck-mark-512.png";
  await new Promise<void>((resolve) => {
    shareLogo.onload = () => resolve();
    shareLogo.onerror = () => resolve();
  });
  if (shareLogo.complete && shareLogo.naturalWidth > 0) {
    ctx.drawImage(shareLogo, 88, 70, 78, 78);
  }

  ctx.fillStyle = "#f7fff9";
  ctx.font = "900 54px system-ui, sans-serif";
  ctx.fillText("GüvenCheck", 188, 120);
  ctx.fillStyle = "#9bb7ad";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("Dijital risk kontrolü", 188, 168);

  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.beginPath();
  ctx.roundRect(68, 235, 944, 850, 46);
  ctx.fill();

  ctx.fillStyle = analysis.level === "high" ? "#ff9d98" : analysis.level === "medium" ? "#ffd38a" : "#83efbb";
  ctx.font = "900 48px system-ui, sans-serif";
  ctx.fillText(levelText[analysis.level].toUpperCase(), 118, 330);

  ctx.fillStyle = "#9db3a8";
  ctx.font = "700 23px system-ui, sans-serif";
  ctx.fillText(`Risk skoru ${analysis.score}/100`, 118, 378);

  ctx.fillStyle = "#f3faf6";
  ctx.font = "900 28px system-ui, sans-serif";
  ctx.fillText("ŞİMDİ YAP", 118, 470);
  ctx.font = "800 43px system-ui, sans-serif";
  let y = 530;
  for (const line of wrapText(ctx, analysis.actions[0] || analysis.summary, 820).slice(0, 4)) {
    ctx.fillText(line, 118, y);
    y += 54;
  }

  ctx.fillStyle = "#f3faf6";
  ctx.font = "800 29px system-ui, sans-serif";
  ctx.fillText("Neden?", 118, 805);
  ctx.fillStyle = "#c9d8d1";
  ctx.font = "500 25px system-ui, sans-serif";
  y = 855;
  for (const signal of analysis.signals.slice(0, 2)) {
    const lines = wrapText(ctx, `• ${signal}`, 800).slice(0, 2);
    for (const line of lines) {
      ctx.fillText(line, 130, y);
      y += 34;
    }
    y += 10;
  }

  ctx.fillStyle = "#b7d4c9";
  ctx.font = "900 27px system-ui, sans-serif";
  ctx.fillText("guvencheck.vercel.app", 88, 1245);
  ctx.fillStyle = "#9db3a8";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText("Göndermeden. Ödemeden. Tıklamadan önce.", 88, 1282);
  if (appUrl) {
    ctx.fillStyle = "#6f8d7e";
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText(appUrl.replace(/^https?:\/\//, ""), 88, 1318);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  return blob ? new File([blob], "guvencheck-sonuc.png", { type: "image/png" }) : null;
}

export default function Home() {
  const [value, setValue] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [processingImage, setProcessingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedbackState, setFeedbackState] = useState<"idle" | "choose" | "sending" | "sent">("idle");
  const [sessionId, setSessionId] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  const [activeProtection, setActiveProtection] = useState<ProtectionObject | null>(null);
  const [protectionMessage, setProtectionMessage] = useState("");
  const [protectionDraft, setProtectionDraft] = useState<ProtectionCandidate | null>(null);
  const [protectionUsefulSent, setProtectionUsefulSent] = useState(false);
  const [deepVerificationInterested, setDeepVerificationInterested] = useState(false);
  const [payerRole, setPayerRole] = useState<"self" | "family" | "work" | "">("");
  const [paymentInterest, setPaymentInterest] = useState<"yes" | "maybe" | "no" | "">("");

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (!standalone) return;
    setShowSplash(true);
    const timer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const key = "guvencheck_beta_session";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(key, id);
    }
    setSessionId(id);
    void fetch("/api/telemetry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", sessionId: id })
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem("guvencheck_active_protection");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<ProtectionObject>;
      const candidate = sanitizeProtectionCandidate(parsed);
      if (!candidate.eligible || !parsed.id || !parsed.savedAt) throw new Error("invalid protection");
      setActiveProtection({ ...candidate, id: String(parsed.id), savedAt: String(parsed.savedAt) });
    } catch {
      window.localStorage.removeItem("guvencheck_active_protection");
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !activeProtection) return;
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "protection_status_view", sessionId }) }).catch(() => undefined);
  }, [sessionId, activeProtection?.id]);

  useEffect(() => {
    const candidate = analysis?.protectionCandidate;
    setProtectionDraft(candidate?.eligible ? { ...candidate } : null);
    setProtectionMessage("");
  }, [analysis]);

  const deepVerification = useMemo(
    () => analysis ? deriveDeepVerification(analysis) : { eligible: false, reason: "" },
    [analysis],
  );
  const protectionBooster = useMemo(
    () => getProtectionBooster(analysis?.manipulationTactics),
    [analysis?.manipulationTactics],
  );

  useEffect(() => {
    setDeepVerificationInterested(false);
    if (!analysis || !deepVerification.eligible || !sessionId) return;
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "deep_verification_eligible", sessionId, analysisType: imageData ? "image" : normalizeUrl(value) ? "link" : "text", requestId: analysis.requestId }) }).catch(() => undefined);
  }, [analysis?.requestId, analysis?.score, deepVerification.eligible, sessionId]);

  const normalizedLink = normalizeUrl(value);
  const analysisType: "text" | "link" | "image" = imageData ? "image" : normalizedLink ? "link" : "text";
  const canSubmit = useMemo(() => {
    if (processingImage) return false;
    if (imageData) return true;
    return value.trim().length >= 3;
  }, [imageData, processingImage, value]);

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      setValue("");
      setImageData(compressed);
      setImageName(file.name);
    } catch (err) {
      setImageData(null);
      setImageName("");
      setError(err instanceof Error ? err.message : "Görsel işlenemedi.");
    } finally {
      setProcessingImage(false);
    }
  }

  async function analyze() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "analysis_started", sessionId, analysisType }) }).catch(() => undefined);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(sessionId ? { "X-GuvenCheck-Session": sessionId } : {}) },
        body: JSON.stringify({
          type: analysisType,
          content: analysisType === "image" ? undefined : analysisType === "link" ? normalizedLink : value.trim(),
          imageData: analysisType === "image" ? imageData : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const suffix = data.requestId ? ` (Kod: ${data.requestId})` : "";
        throw new Error((data.error || "Analiz sırasında hata oluştu.") + suffix);
      }
      setAnalysis(data);
      void fetch("/api/telemetry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "analysis_completed", sessionId, analysisType, score: data.score, level: data.level, route: data.meta?.route, latencyMs: data.meta?.latencyMs })
      }).catch(() => undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Beklenmeyen hata oluştu.";
      setError(message);
      void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "analysis_error", sessionId, analysisType }) }).catch(() => undefined);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnalysis(null);
    setValue("");
    setImageData(null);
    setImageName("");
    setError("");
    setCopied(false);
    setFeedbackState("idle");
    setPayerRole("");
    setPaymentInterest("");
  }

  function saveProtection() {
    if (!protectionDraft?.eligible) return;
    setProtectionMessage("");
    if (!validDraftDate(protectionDraft.deadline)) {
      setProtectionMessage("Kritik tarih YYYY-AA-GG biçiminde geçerli bir tarih olmalı.");
      return;
    }
    const candidate = sanitizeProtectionCandidate(protectionDraft);
    if (!candidate.eligible) {
      setProtectionMessage("Koruma için başlık/aksiyon/özet bilgilerini kontrol et.");
      return;
    }
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "protection_save_intent", sessionId, analysisType }) }).catch(() => undefined);
    const object: ProtectionObject = { ...candidate, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
    window.localStorage.setItem("guvencheck_active_protection", JSON.stringify(object));
    if (activeProtection) void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "repeat_protection", sessionId, analysisType }) }).catch(() => undefined);
    setActiveProtection(object);
    setProtectionDraft({ ...object });
    setProtectionUsefulSent(false);
    setProtectionMessage("Koruma aktif. Kritik aksiyonunu burada takip edebilirsin.");
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "protection_saved", sessionId, analysisType }) }).catch(() => undefined);
  }

  function removeProtection() {
    window.localStorage.removeItem("guvencheck_active_protection");
    setActiveProtection(null);
    setProtectionMessage("");
    setProtectionUsefulSent(false);
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "protection_removed", sessionId }) }).catch(() => undefined);
  }

  const activeProtectionTiming = useMemo(
    () => activeProtection ? getProtectionTiming(activeProtection.deadline) : null,
    [activeProtection?.deadline],
  );

  function markProtectionUseful() {
    if (protectionUsefulSent || !activeProtection) return;
    setProtectionUsefulSent(true);
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "protection_event_useful", sessionId }) }).catch(() => undefined);
  }

  function markDeepVerificationInterest() {
    if (deepVerificationInterested || !deepVerification.eligible) return;
    setDeepVerificationInterested(true);
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "deep_verification_interest", sessionId, analysisType, requestId: analysis?.requestId }) }).catch(() => undefined);
  }

  function recordRevenueEvidence(event: "payer_role" | "payment_interest", value: "self" | "family" | "work" | "yes" | "maybe" | "no") {
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, value, sessionId, analysisType, requestId: analysis?.requestId }) }).catch(() => undefined);
  }

  async function sendFeedback(helpful: boolean, reason = helpful ? "dogru" : "diger") {
    if (!analysis || feedbackState === "sending" || feedbackState === "sent") return;
    setFeedbackState("sending");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helpful, reason, analysisType, score: analysis.score, level: analysis.level,
          route: analysis.meta?.route, requestId: analysis.requestId, sessionId
        })
      });
      setFeedbackState("sent");
      if (helpful) void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "core_decision_value", sessionId, analysisType, requestId: analysis?.requestId }) }).catch(() => undefined);
    } catch {
      setFeedbackState("idle");
    }
  }

  const submitLabel = loading
    ? "Analiz sürüyor…"
    : processingImage
      ? "Görsel hazırlanıyor…"
      : canSubmit
        ? "Kontrol et"
        : "Mesaj, link veya ekran görüntüsü ekle";

  async function shareResult() {
    if (!analysis) return;
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "share_clicked", sessionId, analysisType, score: analysis.score, level: analysis.level }) }).catch(() => undefined);
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "trusted_helper_share", sessionId, analysisType, requestId: analysis?.requestId }) }).catch(() => undefined);
    const appUrl = window.location.origin;
    const text = `GüvenCheck: ${levelText[analysis.level]}. ${analysis.actions[0] || analysis.summary} — Göndermeden. Ödemeden. Tıklamadan önce.\n\nSen de şüpheli bir içerik aldıysan kontrol et: ${appUrl}`;
    const card = await createShareCard(analysis, appUrl).catch(() => null);

    if (card && navigator.canShare?.({ files: [card] })) {
      await navigator.share({ title: "GüvenCheck sonucu", text, files: [card] }).catch(() => undefined);
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: "GüvenCheck sonucu", text }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      {showSplash && (
        <div className="appSplash" aria-hidden="true">
          <img src="/brand/guvencheck-app-icon-1024.png" alt="" />
          <strong>GüvenCheck</strong>
          <span>Göndermeden. Ödemeden. Tıklamadan önce.</span>
        </div>
      )}
      <main className="shell">
      <header className="brandRow">
        <div className="logo" aria-hidden="true"><img src="/brand/guvencheck-mark-512.png" alt="" /></div>
        <div>
          <div className="brand">GüvenCheck</div>
          <div className="tagline">Dijital risk kontrolü</div>
        </div>
      </header>

      {activeProtection && !analysis && (
        <section className="card">
          <div className="eyebrow">KORUMA AKTİF</div>
          <h2>{activeProtection.title || "Korunan taahhüt"}</h2>
          {activeProtection.provider && <p><strong>Sağlayıcı:</strong> {activeProtection.provider}</p>}
          {activeProtection.deadline && <p><strong>Kritik tarih:</strong> {activeProtection.deadline}</p>}
          {activeProtectionTiming && <p className="protectionTiming"><strong>{activeProtectionTiming.label}</strong></p>}
          <p><strong>Sıradaki aksiyon:</strong> {activeProtection.nextAction}</p>
          {activeProtectionTiming && ["today", "soon", "overdue"].includes(activeProtectionTiming.state) && (
            <button type="button" className="secondary protectionUseful" disabled={protectionUsefulSent} onClick={markProtectionUseful}>{protectionUsefulSent ? "Geri bildirim alındı" : "Bu hatırlatma işime yaradı"}</button>
          )}
          <button type="button" className="secondary" onClick={removeProtection}>Koruma kaydını kaldır</button>
        </section>
      )}

      {!analysis ? (
        <section className="card heroCard">
          <h1>Şüpheli bir şey mi var?</h1>
          <p className="lead">Şüpheli dijital içeriği tek yerden gönder. Mesaj, link veya ekran görüntüsü fark etmez; GüvenCheck uygun kontrol yolunu kendi seçer.</p>

          <div className="inputWrap">
            <textarea
              value={value}
              maxLength={12000}
              inputMode="text"
              onChange={(e) => { setValue(e.target.value); setImageData(null); setImageName(""); setError(""); }}
              placeholder="Şüpheli mesajı, linki, teklif veya taahhüt metnini buraya yapıştır..."
              rows={6}
            />
            {value.length > 0 && !imageData && <span className="charCount">{value.length}/12000</span>}
          </div>

          <label className={`dropzone ${imageData ? "hasImage" : ""}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} />
            {!imageData && <span className="camera" aria-hidden="true">▣</span>}
            <strong>{processingImage ? "Görsel hazırlanıyor…" : imageName || "Ekran görüntüsü ekle"}</strong>
            {!imageData && <span>İstersen screenshot ekle; sistem içerik türünü kendi seçer.</span>}
            {imageData && <img className="preview" src={imageData} alt="Seçilen ekran görüntüsü" />}
            {imageData && <span className="changeImage">Değiştirmek için dokun</span>}
          </label>
          {imageData && (
            <button type="button" className="secondary" onClick={() => { setImageData(null); setImageName(""); }}>
              Görseli kaldır
            </button>
          )}

          {error && <div className="error">{error}</div>}

          <button className="primary" disabled={!canSubmit || loading} onClick={analyze}>
            {loading ? <><span className="spinner" /> {submitLabel}</> : submitLabel}
          </button>

          {loading && <div className="analysisProgress" role="status" aria-live="polite">
            <span className="progressDot" />
            <div><strong>Risk sinyalleri kontrol ediliyor…</strong><small>İçerik değerlendiriliyor. Bu işlem birkaç saniye sürebilir.</small></div>
          </div>}

          <p className="privacy">🔒 <strong>Gönderdiğin içerikleri kendi veritabanımızda saklamıyoruz.</strong> Görseller gönderilmeden önce küçültülür ve yeniden kodlanır. <a href="/privacy">Gizlilik özeti</a></p>
        </section>
      ) : (
        <section className={`card result ${analysis.level}`}>
          <div className="decisionTop">
            <div>
              <div className="eyebrow">GÜVENCHECK SONUCU</div>
              <div className={`decisionLabel ${analysis.level}`}>{levelText[analysis.level]}</div>
            </div>
            <div className="compactScore" aria-label={`Risk skoru ${analysis.score}/100`}><strong>{analysis.score}</strong><span>/100</span><small>Risk skoru</small></div>
          </div>
          <div className={`nextAction ${analysis.level}`}>
            <span>ŞİMDİ YAP</span>
            <strong>{analysis.actions[0] || "İşlemi durdur ve bağımsız doğrula."}</strong>
          </div>
          {analysis.level === "low" && <p className="lowRiskCaveat">Belirgin risk görülmemesi, içeriğin kesin olarak güvenli olduğu anlamına gelmez.</p>}

          {analysis.decisionSupport && (
            <div className="section decisionSupport">
              <h3>Bu sonuç kararını nasıl etkiliyor?</h3>
              <p><strong>Belirsizlik: {uncertaintyText[analysis.decisionSupport.uncertainty]}</strong> — {analysis.decisionSupport.uncertaintySummary}</p>
              <p><strong>Karar etkisi:</strong> {analysis.decisionSupport.implication}</p>
              <p><strong>Güvenli sonraki adım:</strong> {analysis.decisionSupport.nextAction}</p>
            </div>
          )}

          {analysis.manipulationTactics && analysis.manipulationTactics.length > 0 && (
            <div className="section decisionSupport">
              <h3>Nasıl yönlendirilmeye çalışılıyor?</h3>
              {analysis.manipulationSummary && <p>{analysis.manipulationSummary}</p>}
              <ul>{analysis.manipulationTactics.map((tactic) => <li key={tactic}>{MANIPULATION_LABELS[tactic]}</li>)}</ul>
            </div>
          )}

          {protectionBooster && (
            <div className="section decisionSupport">
              <h3>Bir dahaki sefere daha erken fark et</h3>
              <p><strong>{protectionBooster.title}</strong></p>
              <p>{protectionBooster.action}</p>
            </div>
          )}

          {deepVerification.eligible && (
            <div className="section decisionSupport">
              <h3>Daha derin doğrulama anlamlı olabilir</h3>
              <p>{deepVerification.reason}</p>
              <p>Bu buton ödeme veya sipariş başlatmaz; yalnız bu tür vakalarda daha derin doğrulamaya ilgi olup olmadığını ölçer.</p>
              <button type="button" className="secondary" disabled={deepVerificationInterested} onClick={markDeepVerificationInterest}>{deepVerificationInterested ? "İlgin kaydedildi" : "Daha derin doğrulamayla ilgileniyorum"}</button>
              {deepVerificationInterested && (
                <div className="feedbackReasons">
                  <strong>Bu tür doğrulamayı en çok kimin için kullanırdın?</strong>
                  <div className="feedbackButtons">
                    <button disabled={Boolean(payerRole)} onClick={() => { setPayerRole("self"); recordRevenueEvidence("payer_role", "self"); }}>Kendim</button>
                    <button disabled={Boolean(payerRole)} onClick={() => { setPayerRole("family"); recordRevenueEvidence("payer_role", "family"); }}>Ailem</button>
                    <button disabled={Boolean(payerRole)} onClick={() => { setPayerRole("work"); recordRevenueEvidence("payer_role", "work"); }}>İş için</button>
                  </div>
                  <strong>Ek kanıt üreten ücretli bir seçenek olsa değerlendirir miydin?</strong>
                  <div className="feedbackButtons">
                    <button disabled={Boolean(paymentInterest)} onClick={() => { setPaymentInterest("yes"); recordRevenueEvidence("payment_interest", "yes"); }}>Evet</button>
                    <button disabled={Boolean(paymentInterest)} onClick={() => { setPaymentInterest("maybe"); recordRevenueEvidence("payment_interest", "maybe"); }}>Belki</button>
                    <button disabled={Boolean(paymentInterest)} onClick={() => { setPaymentInterest("no"); recordRevenueEvidence("payment_interest", "no"); }}>Hayır</button>
                  </div>
                  {(payerRole || paymentInterest) && <p>Bu yalnız ürün araştırmasıdır; ödeme veya sipariş başlatmaz.</p>}
                </div>
              )}
            </div>
          )}

          {protectionDraft?.eligible && (
            <div className="section decisionSupport">
              <h3>Bu kararı korumaya al</h3>
              <p>Kaydetmeden önce alanları kontrol edip düzeltebilirsin.</p>
              <label className="protectionField">Başlık<input value={protectionDraft.title} onChange={(e) => setProtectionDraft(d => d ? { ...d, title: e.target.value } : d)} /></label>
              <label className="protectionField">Sağlayıcı<input value={protectionDraft.provider} onChange={(e) => setProtectionDraft(d => d ? { ...d, provider: e.target.value } : d)} /></label>
              <label className="protectionField">Kritik tarih (opsiyonel)<input value={protectionDraft.deadline} placeholder="YYYY-AA-GG" onChange={(e) => setProtectionDraft(d => d ? { ...d, deadline: e.target.value } : d)} /></label>
              <label className="protectionField">Sıradaki aksiyon<textarea rows={3} value={protectionDraft.nextAction} onChange={(e) => setProtectionDraft(d => d ? { ...d, nextAction: e.target.value } : d)} /></label>
              <p>{protectionDraft.summary}</p>
              <p>Yalnız bu yapılandırılmış özet cihazında saklanır; gönderdiğin ham içerik kaydedilmez.</p>
              <button type="button" className="secondary" onClick={saveProtection}>Korumaya al</button>
              {protectionMessage && <p><strong>{protectionMessage}</strong></p>}
            </div>
          )}

          <div className="section compactReasons">
            <h3>Neden böyle düşünüyoruz?</h3>
            <ul>{analysis.signals.slice(0, 3).map((s, i) => <li key={i}><span className="listIcon">✓</span><span>{s}</span></li>)}</ul>
          </div>

          <details className="explanationDetails">
            <summary>Ayrıntılı açıklamayı göster</summary>
            <div className="explanationBody">
              <h2>{analysis.title}</h2>
              <p className="summary">{analysis.summary}</p>
              {analysis.signals.length > 3 && (
                <div className="section extraSignals">
                  <h3>Diğer sinyaller</h3>
                  <ul>{analysis.signals.slice(3).map((s, i) => <li key={i}><span className="listIcon">✓</span><span>{s}</span></li>)}</ul>
                </div>
              )}
            </div>
          </details>
          <div className="feedbackBox" aria-live="polite">
            {feedbackState === "sent" ? (
              <p>Teşekkürler. Bu geri bildirim analiz içeriğini değil, yalnızca sonuç kalitesini ölçmemize yardımcı olur.</p>
            ) : feedbackState === "choose" ? (
              <div className="feedbackReasons">
                <strong>Nesi iyi değildi?</strong>
                <button onClick={() => sendFeedback(false, "fazla_supheci")}>Fazla şüpheciydi</button>
                <button onClick={() => sendFeedback(false, "riski_az_gosterdi")}>Riski az gösterdi</button>
                <button onClick={() => sendFeedback(false, "anlasilmadi")}>Açıklama anlaşılmadı</button>
                <button onClick={() => sendFeedback(false, "karar_net_degildi")}>Karar vermemi kolaylaştırmadı</button>
                <button onClick={() => sendFeedback(false, "sonraki_adim_net_degildi")}>Sonraki adım net değildi</button>
                <button onClick={() => sendFeedback(false, "belirsizlik_anlasilmadi")}>Belirsizlik açıklaması anlaşılmadı</button>
                <button onClick={() => sendFeedback(false, "diger")}>Diğer</button>
              </div>
            ) : (
              <>
                <strong>Bu sonuç işine yaradı mı?</strong>
                <div className="feedbackButtons">
                  <button onClick={() => sendFeedback(true)} disabled={feedbackState === "sending"}>Evet</button>
                  <button onClick={() => setFeedbackState("choose")} disabled={feedbackState === "sending"}>Hayır</button>
                </div>
              </>
            )}
          </div>
          <p className="disclaimer">GüvenCheck kesin bir dolandırıcılık kararı vermez; risk sinyallerini değerlendirir. Finansal veya hassas işlem yapmadan önce ilgili kurumu kendi resmî kanalından doğrula.</p>

          <div className="buttonRow">
            <button className="secondary" onClick={reset}>Yeni kontrol</button>
            <button className="primary share" onClick={shareResult}>{copied ? "Kopyalandı ✓" : "Güvendiğim birine gönder"}</button>
          </div>
        </section>
      )}
      <footer>
        <div>Göndermeden. Ödemeden. Tıklamadan önce.</div>
        <strong>GüvenCheck · Karaaslan Labs</strong>
        <a href="/privacy" style={{color:"inherit"}}>Gizlilik</a>
      </footer>
    </main>
    </>
  );
}
