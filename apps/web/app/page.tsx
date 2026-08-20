"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type RiskLevel = "low" | "medium" | "high";
type Analysis = {
  requestId?: string;
  score: number;
  level: RiskLevel;
  title: string;
  summary: string;
  signals: string[];
  actions: string[];
  avoid: string[];
  confidence: "low" | "medium" | "high";
  verificationStatus?: "not_checked" | "checked_no_strong_signal" | "checked_mixed" | "checked_risk_signals";
  verificationSummary?: string;
  verifiedFindings?: string[];
  sources?: Array<{ title: string; url: string }>;
  webVerified?: boolean;
  mode?: "ai" | "demo";
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
  const [tab, setTab] = useState<"text" | "link" | "image">("image");
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

  const normalizedLink = tab === "link" ? normalizeUrl(value) : null;
  const linkIsValid = tab !== "link" || value.trim().length === 0 || Boolean(normalizedLink);
  const canSubmit = useMemo(() => {
    if (processingImage) return false;
    if (tab === "image") return Boolean(imageData);
    if (tab === "link") return value.trim().length >= 4 && Boolean(normalizeUrl(value));
    return value.trim().length >= 3;
  }, [tab, imageData, processingImage, value]);

  function switchTab(next: "text" | "link" | "image") {
    setTab(next);
    setAnalysis(null);
    setError("");
    setCopied(false);
    setFeedbackState("idle");
  }

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    setError("");
    try {
      const compressed = await compressImage(file);
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
      void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "analysis_started", sessionId, analysisType: tab }) }).catch(() => undefined);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(sessionId ? { "X-GuvenCheck-Session": sessionId } : {}) },
        body: JSON.stringify({
          type: tab,
          content: tab === "image" ? undefined : tab === "link" ? normalizeUrl(value) : value.trim(),
          imageData: tab === "image" ? imageData : undefined,
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
        body: JSON.stringify({ event: "analysis_completed", sessionId, analysisType: tab, score: data.score, level: data.level, route: data.meta?.route, latencyMs: data.meta?.latencyMs })
      }).catch(() => undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Beklenmeyen hata oluştu.";
      setError(message);
      void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "analysis_error", sessionId, analysisType: tab }) }).catch(() => undefined);
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
  }

  async function sendFeedback(helpful: boolean, reason = helpful ? "dogru" : "diger") {
    if (!analysis || feedbackState === "sending" || feedbackState === "sent") return;
    setFeedbackState("sending");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helpful, reason, analysisType: tab, score: analysis.score, level: analysis.level,
          route: analysis.meta?.route, requestId: analysis.requestId, sessionId
        })
      });
      setFeedbackState("sent");
    } catch {
      setFeedbackState("idle");
    }
  }

  const submitLabel = loading
    ? "Analiz sürüyor…"
    : canSubmit
      ? "Kontrol et"
      : tab === "image"
        ? "Önce ekran görüntüsü seç"
        : tab === "text"
          ? "Önce mesajı yapıştır"
          : "Önce linki gir";

  async function shareResult() {
    if (!analysis) return;
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "share_clicked", sessionId, analysisType: tab, score: analysis.score, level: analysis.level }) }).catch(() => undefined);
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

      {!analysis ? (
        <section className="card heroCard">
          <h1>Şüpheli bir şey mi var?</h1>
          <p className="lead">Mesajı, linki veya ekran görüntüsünü kontrol et. Risk seviyesini ve ne yapman gerektiğini sade Türkçeyle gör.</p>

          <div className="tabs" role="tablist" aria-label="Analiz türü">
            <button className={`imageTab ${tab === "image" ? "active" : ""}`} onClick={() => switchTab("image")}><span>Ekran görüntüsü</span><em>En kolay yol</em></button>
            <button className={tab === "text" ? "active" : ""} onClick={() => switchTab("text")}>Mesaj</button>
            <button className={tab === "link" ? "active" : ""} onClick={() => switchTab("link")}>Link</button>
          </div>

          {tab === "image" ? (
            <label className={`dropzone ${imageData ? "hasImage" : ""}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} />
              {!imageData && <span className="camera" aria-hidden="true">▣</span>}
              <strong>{processingImage ? "Görsel hazırlanıyor…" : imageName || "Ekran görüntüsü seç"}</strong>
              {!imageData && <span>SMS, WhatsApp, e-posta veya ilan ekranı</span>}
              {imageData && <img className="preview" src={imageData} alt="Seçilen ekran görüntüsü" />}
              {imageData && <span className="changeImage">Değiştirmek için dokun</span>}
            </label>
          ) : (
            <div className="inputWrap">
              <textarea
                value={value}
                maxLength={12000}
                inputMode={tab === "link" ? "url" : "text"}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder={tab === "link" ? "https://ornek-site.com/..." : "Örn: Sayın müşterimiz, hesabınız askıya alınacaktır..."}
                rows={7}
              />
              {tab === "text" && value.length > 0 && <span className="charCount">{value.length}/12000</span>}
            </div>
          )}

          {tab === "link" && !linkIsValid && <div className="hintError">Geçerli bir alan adı veya link gir. Örn: guvencheck.com veya https://guvencheck.com</div>}
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
            <button className="primary share" onClick={shareResult}>{copied ? "Kopyalandı ✓" : "Aileme gönder"}</button>
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
