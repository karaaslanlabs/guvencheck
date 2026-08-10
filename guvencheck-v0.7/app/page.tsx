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
  low: "Düşük risk",
  medium: "Dikkatli ol",
  high: "Yüksek risk",
};

const confidenceText = { low: "sınırlı", medium: "orta", high: "güçlü" } as const;

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

async function createShareCard(analysis: Analysis): Promise<File | null> {
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

  ctx.fillStyle = "#67e8aa";
  ctx.font = "800 54px system-ui, sans-serif";
  ctx.fillText("GüvenCheck", 88, 120);
  ctx.fillStyle = "#9db3a8";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText("Göndermeden. Ödemeden. Tıklamadan önce.", 88, 168);

  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.beginPath();
  ctx.roundRect(68, 235, 944, 850, 46);
  ctx.fill();

  ctx.fillStyle = "#9db3a8";
  ctx.font = "800 26px system-ui, sans-serif";
  ctx.fillText("RİSK SKORU", 118, 320);
  ctx.fillStyle = "#f3faf6";
  ctx.font = "900 164px system-ui, sans-serif";
  ctx.fillText(String(analysis.score), 110, 500);
  ctx.fillStyle = "#9db3a8";
  ctx.font = "700 42px system-ui, sans-serif";
  ctx.fillText("/100", 390, 496);

  ctx.fillStyle = analysis.level === "high" ? "#ff9d98" : analysis.level === "medium" ? "#ffd38a" : "#83efbb";
  ctx.font = "850 38px system-ui, sans-serif";
  ctx.fillText(levelText[analysis.level].toUpperCase(), 118, 575);

  ctx.fillStyle = "#f3faf6";
  ctx.font = "800 46px system-ui, sans-serif";
  let y = 670;
  for (const line of wrapText(ctx, analysis.title, 820).slice(0, 3)) {
    ctx.fillText(line, 118, y);
    y += 58;
  }

  ctx.fillStyle = "#b8c9c0";
  ctx.font = "500 31px system-ui, sans-serif";
  y += 22;
  for (const line of wrapText(ctx, analysis.summary, 820).slice(0, 5)) {
    ctx.fillText(line, 118, y);
    y += 43;
  }

  ctx.fillStyle = "#f3faf6";
  ctx.font = "800 29px system-ui, sans-serif";
  ctx.fillText("En önemli sinyaller", 118, 950);
  ctx.fillStyle = "#c9d8d1";
  ctx.font = "500 25px system-ui, sans-serif";
  y = 995;
  for (const signal of analysis.signals.slice(0, 3)) {
    const lines = wrapText(ctx, `• ${signal}`, 800).slice(0, 2);
    for (const line of lines) {
      ctx.fillText(line, 130, y);
      y += 34;
    }
    y += 10;
  }

  ctx.fillStyle = "#7f998d";
  ctx.font = "500 23px system-ui, sans-serif";
  ctx.fillText("Risk analizi kesin dolandırıcılık kararı değildir.", 88, 1250);
  ctx.fillStyle = "#67e8aa";
  ctx.font = "800 27px system-ui, sans-serif";
  ctx.fillText("guvencheck · kontrol et, sonra karar ver", 88, 1300);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  return blob ? new File([blob], "guvencheck-sonuc.png", { type: "image/png" }) : null;
}

export default function Home() {
  const [tab, setTab] = useState<"text" | "link" | "image">("text");
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

  async function shareResult() {
    if (!analysis) return;
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "share_clicked", sessionId, analysisType: tab, score: analysis.score, level: analysis.level }) }).catch(() => undefined);
    const text = `GüvenCheck sonucu: ${analysis.score}/100 — ${levelText[analysis.level]}. ${analysis.summary}`;
    const card = await createShareCard(analysis).catch(() => null);

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
    <main className="shell">
      <header className="brandRow">
        <div className="logo" aria-hidden="true">G</div>
        <div>
          <div className="brand">GüvenCheck</div>
          <div className="tagline">Göndermeden. Ödemeden. Tıklamadan önce.</div>
        </div>
        <div className="vbadge">Kapalı Beta</div>
      </header>

      {!analysis ? (
        <section className="card heroCard">
          <div className="shield" aria-hidden="true">✓</div>
          <h1>Şüpheli bir şey mi geldi?</h1>
          <p className="lead">Mesajı, linki veya ekran görüntüsünü gönder. GüvenCheck risk sinyallerini sade Türkçeyle açıklasın.</p>

          <div className="trustStrip">
            <span>Üyelik yok</span><span>•</span><span>Hızlı kontrol</span><span>•</span><span>Risk odaklı</span>
          </div>

          <div className="tabs" role="tablist" aria-label="Analiz türü">
            <button className={tab === "text" ? "active" : ""} onClick={() => switchTab("text")}>Mesaj</button>
            <button className={tab === "link" ? "active" : ""} onClick={() => switchTab("link")}>Link</button>
            <button className={tab === "image" ? "active" : ""} onClick={() => switchTab("image")}>Ekran görüntüsü</button>
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
            {loading ? <><span className="spinner" /> Kontrol ediliyor…</> : "Kontrol et"}
          </button>

          <p className="privacy">🔒 Ekran görüntüsü gönderilmeden önce küçültülür ve yeniden kodlanır. Kapalı beta sırasında analiz içeriğini kendi veritabanımızda saklamıyoruz. <a href="/privacy">Gizlilik özeti</a></p>
        </section>
      ) : (
        <section className={`card result ${analysis.level}`}>
          <div className="resultTop">
            <div>
              <div className="eyebrow">RİSK SKORU</div>
              <div className="score">{analysis.score}<span>/100</span></div>
            </div>
            <div className={`pill ${analysis.level}`}>{levelText[analysis.level]}</div>
          </div>

          <div className="meter" aria-label={`Risk skoru ${analysis.score}/100`}><div style={{ width: `${analysis.score}%` }} /></div>
          <h2>{analysis.title}</h2>
          <p className="summary">{analysis.summary}</p>

          <div className="section">
            <h3>Tespit edilen sinyaller</h3>
            <ul>{analysis.signals.map((s, i) => <li key={i}><span className="listIcon">✓</span><span>{s}</span></li>)}</ul>
          </div>

          {analysis.verificationStatus && analysis.verificationStatus !== "not_checked" && (
            <details className="verifyBox verificationDetails">
              <summary className="verifyHead">
                <div>
                  <h3>Harici doğrulama</h3>
                  <span className="verifyTeaser">{analysis.verificationSummary || "Web taraması tamamlandı."}</span>
                </div>
                <span className={`verifyBadge ${analysis.verificationStatus}`}>{analysis.webVerified ? "Web taraması yapıldı" : "Doğrulama sonucu"}</span>
              </summary>
              <div className="verifyBody">
                {analysis.verifiedFindings && analysis.verifiedFindings.length > 0 && (
                  <ul>{analysis.verifiedFindings.slice(0, 4).map((s, i) => <li key={i}><span className="listIcon">↗</span><span>{s}</span></li>)}</ul>
                )}
                {analysis.sources && analysis.sources.length > 0 && (
                  <div className="sourceList">
                    {analysis.sources.slice(0, 4).map((source, i) => (
                      <a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noreferrer">
                        <span className="sourceText"><strong>{sourceLabel(source.url, tab === "link" ? value : undefined)}</strong><em>{source.title}</em></span><span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                )}
                <p className="sourceCaveat">Hedef sitenin kendi içeriği bağımsız güven kanıtı değildir. Kullanıcı şikâyetleri de tek başına kesin suç veya dolandırıcılık kanıtı sayılmaz.</p>
              </div>
            </details>
          )}

          <div className="section actionBox">
            <h3>Şimdi ne yapmalısın?</h3>
            <ol>{analysis.actions.map((s, i) => <li key={i}><span className="step">{i + 1}</span><span>{s}</span></li>)}</ol>
          </div>

          {analysis.avoid.length > 0 && (
            <div className="section avoidBox">
              <h3>Şunları yapma</h3>
              <ul>{analysis.avoid.map((s, i) => <li key={i}><span className="cross">×</span><span>{s}</span></li>)}</ul>
            </div>
          )}

          <div className="modeLine">
            <span className={analysis.mode === "ai" ? "liveDot" : "demoDot"} />
            {analysis.mode === "ai" ? "AI destekli risk analizi" : "Demo analizi"} · Kanıt gücü: {confidenceText[analysis.confidence]}
          </div>
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

      <div className="safetyNote">Acil para, şifre veya doğrulama kodu talebinde en güvenli ilk hareket: <strong>işlemi durdur ve bağımsız doğrula.</strong></div>
      <footer>GüvenCheck · Kapalı Beta V0.7 · <a href="/privacy" style={{color:"inherit"}}>Gizlilik</a></footer>
    </main>
  );
}
