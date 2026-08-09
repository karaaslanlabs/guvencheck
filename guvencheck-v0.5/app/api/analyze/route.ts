import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 12_000;
const MAX_IMAGE_DATA_LENGTH = 5_500_000;

type Payload = {
  type: "text" | "link" | "image";
  content?: string;
  imageData?: string;
  benchmarkModel?: "gpt-5.6-terra" | "gpt-5.6-luna";
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    level: { type: "string", enum: ["low", "medium", "high"] },
    title: { type: "string" },
    summary: { type: "string" },
    signals: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    actions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    avoid: { type: "array", items: { type: "string" }, maxItems: 5 },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    verificationStatus: { type: "string", enum: ["not_checked", "checked_no_strong_signal", "checked_mixed", "checked_risk_signals"] },
    verificationSummary: { type: "string" },
    verifiedFindings: { type: "array", items: { type: "string" }, maxItems: 5 },
    extractedUrls: { type: "array", items: { type: "string" }, maxItems: 3 }
  },
  required: ["score", "level", "title", "summary", "signals", "actions", "avoid", "confidence", "verificationStatus", "verificationSummary", "verifiedFindings", "extractedUrls"]
};

const SYSTEM_PROMPT = `Sen GüvenCheck adlı Türkiye odaklı dijital güven asistanının risk analiz motorusun.
Görevin kullanıcı tarafından verilen mesaj, URL veya ekran görüntüsünde dolandırıcılık, kimlik avı, sosyal mühendislik, sahte kurum, ödeme baskısı ve şüpheli ticaret sinyallerini değerlendirmektir.

Kurallar:
- Kesin hüküm verme. "Dolandırıcıdır" veya "kesin güvenlidir" deme. Risk sinyali ve olasılık dili kullan.
- Kanıt yoksa kişi veya kurum hakkında suç isnadı yapma.
- Resmî kurum, banka, kargo, icra, HGS, vergi, e-Devlet, yatırım, iş teklifi, kapora, sahte destek ve alışveriş taklitlerine dikkat et.
- Aciliyet, korku, gizlilik talebi, OTP/şifre isteme, uzaktan erişim uygulaması kurdurma, alışılmadık ödeme yöntemi, IBAN/kripto transferi, link alan adı tutarsızlığı ve gerçek dışı vaatleri güçlü sinyal say.
- Mesaj ve ekran görüntüsü analizinde harici web doğrulaması yapmadıysan bunu açıkça belirt.
- URL analizinde web araması aracı verildiyse MUTLAKA kullan. Alan adını exact domain ile, marka taklidi ihtimaliyle ve "dolandırıcılık / scam / phishing / şikayet" bağlamlarıyla araştır. Arama sonucu yoksa bunu kanıt yokluğu olarak yorumla; güvenli olduğu sonucuna atlama.
- Arama sonuçlarında yalnızca iddiayı destekleyen kaynakları kullan; tek bir zayıf kullanıcı yorumu ile kesin hüküm verme. Resmî kurumlar, güvenilir güvenlik sağlayıcıları, bilinen haber kaynakları ve tutarlı çoklu kullanıcı bildirimlerini daha yüksek ağırlıkla değerlendir.
- Hedef sitenin kendi sayfası, sitenin güvenilir olduğuna dair bağımsız kanıt değildir; yalnızca sitenin ne sunduğunu anlamak için kullanılabilir.
- Şikâyet platformları kullanıcı bildirimi kanıtıdır, resmî doğrulama veya mahkeme kararı değildir. Bunu açıkça ayır.
- Alan adının bir markaya benzemesi tek başına suç kanıtı değildir. Resmî alan adı eşleşmesini ve sitenin ne talep ettiğini ayrı ayrı değerlendir.
- Görselde kişisel veri varsa analiz için gerekmeyen kısmını sonuçta tekrar etme.
- Skoru sinyal sayısına göre mekanik verme: sinyallerin şiddetini ve birlikte görülmesini değerlendir.
- Sonuç Türkçe, kısa, sakin ve eyleme dönük olsun. Başlık en fazla 12 kelime, özet en fazla 3 kısa cümle olsun.
- Structured output metin alanlarının içine URL, Markdown linki veya kaynak parantezi yazma; kaynaklar arayüzde ayrı kartlar olarak gösterilecek.
- Görsel veya metin içinde açıkça görülen http/https bağlantılarını extractedUrls alanına aynen çıkar. Bağlantı yoksa boş dizi döndür. URL uydurma.
- Yüksek riskte para göndermeme, linke tıklamama, OTP/şifre paylaşmama ve kurumu mesajdaki kanal yerine kendi resmî sitesi/uygulaması/numarasından doğrulama tavsiyesi ver.
- Düşük risk sonucu bile içeriğin kesin güvenli olduğu anlamına gelmez.
- Kullanıcı için en kritik 3-5 sinyali öne çıkar; aynı şeyi farklı cümlelerle tekrarlama.`;

function normalizeHttpUrl(value: string) {
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

function isValidHttpUrl(value: string) {
  return Boolean(normalizeHttpUrl(value));
}

function getUrlFacts(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  const labels = hostname.split(".").filter(Boolean);
  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIpv6 = hostname.includes(":");
  return {
    hostname,
    protocol: url.protocol.replace(":", ""),
    usesHttps: url.protocol === "https:",
    hasUserInfo: Boolean(url.username || url.password),
    hasPunycode: hostname.includes("xn--"),
    isIpHost: isIpv4 || isIpv6,
    nonStandardPort: Boolean(url.port && !["80", "443"].includes(url.port)),
    subdomainLabels: Math.max(0, labels.length - 2),
    queryParamCount: Array.from(url.searchParams.keys()).length,
    pathLength: url.pathname.length
  };
}

function cleanModelText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, "$1")
    .replace(/\((https?:\/\/[^)\s]+)\)/gi, "")
    .replace(/https?:\/\/[^\s]+\?utm_source=openai\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeAnalysis(parsed: any) {
  return {
    ...parsed,
    title: cleanModelText(parsed?.title).slice(0, 180),
    summary: cleanModelText(parsed?.summary).slice(0, 700),
    signals: Array.isArray(parsed?.signals) ? parsed.signals.map(cleanModelText).filter(Boolean).slice(0, 5) : [],
    actions: Array.isArray(parsed?.actions) ? parsed.actions.map(cleanModelText).filter(Boolean).slice(0, 5) : [],
    avoid: Array.isArray(parsed?.avoid) ? parsed.avoid.map(cleanModelText).filter(Boolean).slice(0, 4) : [],
    verificationSummary: cleanModelText(parsed?.verificationSummary).slice(0, 600),
    verifiedFindings: Array.isArray(parsed?.verifiedFindings) ? parsed.verifiedFindings.map(cleanModelText).filter(Boolean).slice(0, 4) : [],
    extractedUrls: Array.isArray(parsed?.extractedUrls) ? parsed.extractedUrls.filter((u: unknown) => typeof u === "string" && /^https?:\/\//i.test(u)).slice(0, 3) : []
  };
}

function demoAnalyze(input: string) {
  const text = input.toLocaleLowerCase("tr-TR");
  const patterns = [
    [/(acil|hemen|son uyarı|son gün|askıya|kapatılacak|yasal işlem|haciz|ceza)/i, "Aciliyet veya korku baskısı kuruluyor."],
    [/(şifre|parola|otp|doğrulama kodu|sms kodu|tek kullanımlık)/i, "Şifre veya doğrulama bilgisiyle ilgili hassas talep var."],
    [/(iban|havale|eft|kripto|usdt|ödeme yap|para gönder|kapora)/i, "Doğrudan para transferi veya kapora talebi bulunuyor."],
    [/(polis|savcı|jandarma|banka|e-devlet|hgs|vergi|icra|ptt|kargo)/i, "Resmî kurum veya güvenilir kuruluş adı kullanılıyor."],
    [/(anydesk|teamviewer|uzaktan erişim|ekran paylaş)/i, "Cihaza veya ekrana uzaktan erişim talebi bulunuyor."],
    [/(hediye|kazandınız|çekiliş|bedava|garanti kazanç|yüksek getiri|risksiz kazanç)/i, "Gerçekçi olmayabilecek ödül veya kazanç vaadi bulunuyor."],
    [/(bit\.ly|tinyurl|t\.co|cutt\.ly|is\.gd)/i, "Kısaltılmış bağlantı gerçek hedefi gizleyebilir."]
  ] as const;

  const signals: string[] = patterns.filter(([regex]) => regex.test(text)).map(([, label]) => label);
  if (/https?:\/\//i.test(text)) signals.push("İçerik bir bağlantıya yönlendiriyor; alan adını bağımsız doğrulamak gerekir.");

  let score = Math.min(96, 14 + signals.length * 14);
  if (signals.length === 0) score = 22;
  if (/(otp|doğrulama kodu|şifre|anydesk|teamviewer)/i.test(text) && /(para|ödeme|iban|banka)/i.test(text)) score = Math.max(score, 88);
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return {
    score,
    level,
    title: level === "high" ? "Bu içerik güçlü risk sinyalleri taşıyor" : level === "medium" ? "Doğrulamadan işlem yapma" : "Belirgin risk sinyali az",
    summary: level === "high" ? "İçerikte sosyal mühendislik veya dolandırıcılıkla uyumlu birden fazla işaret bulundu." : level === "medium" ? "Kesin bir sonuca varmak için bağımsız doğrulama gerekiyor." : "Metinde belirgin bir dolandırıcılık kalıbı az görünüyor; bu sonuç içeriğin kesin güvenli olduğu anlamına gelmez.",
    signals: signals.length ? signals.slice(0, 6) : ["Demo taramasında belirgin aciliyet, para transferi veya şifre talebi kalıbı bulunmadı."],
    actions: ["Göndereni mesajdaki link veya numaradan değil, kurumun kendi resmî kanalından doğrula.", "Para veya hassas bilgi isteniyorsa işlem yapmadan önce ikinci bir doğrulama yap."],
    avoid: level === "high" ? ["Linke tıklama.", "Para gönderme.", "Şifre veya SMS doğrulama kodu paylaşma."] : ["Yalnızca bu skora bakarak güvenli kabul etme."],
    confidence: signals.length >= 3 ? "medium" : "low",
    verificationStatus: "not_checked" as const,
    verificationSummary: "Demo modunda harici web doğrulaması yapılmadı.",
    verifiedFindings: [],
    extractedUrls: Array.from(input.matchAll(/https?:\/\/[^\s<>"]+/gi)).map(m => m[0]).slice(0, 3),
    sources: [],
    mode: "demo" as const
  };
}

function extractOutputText(data: any): string | undefined {
  if (typeof data?.output_text === "string") return data.output_text;
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return undefined;
}


function extractWebSources(data: any) {
  const seen = new Set<string>();
  const sources: Array<{ title: string; url: string }> = [];

  const add = (title: unknown, url: unknown) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url) || seen.has(url)) return;
    seen.add(url);
    sources.push({ title: typeof title === "string" && title.trim() ? title.trim() : new URL(url).hostname, url });
  };

  for (const item of data?.output || []) {
    if (item?.type === "web_search_call") {
      for (const source of item?.action?.sources || []) add(undefined, source?.url);
      if (typeof item?.action?.url === "string") add(undefined, item.action.url);
    }
    for (const content of item?.content || []) {
      for (const annotation of content?.annotations || []) {
        if (annotation?.type === "url_citation") add(annotation?.title, annotation?.url);
      }
    }
  }
  return sources.slice(0, 5);
}

function countWebSearchCalls(data: any) {
  return (data?.output || []).filter((item: any) => item?.type === "web_search_call").length;
}


function estimateApiCost(model: string, usage: any, webSearchCalls: number) {
  const input = Number(usage?.input_tokens || 0);
  const cached = Number(usage?.input_tokens_details?.cached_tokens || 0);
  const uncached = Math.max(0, input - cached);
  const output = Number(usage?.output_tokens || 0);
  const prices: Record<string, { input: number; cached: number; output: number }> = {
    "gpt-5.6-terra": { input: 2.5, cached: 0.25, output: 15 },
    "gpt-5.6-luna": { input: 1, cached: 0.10, output: 6 },
    "gpt-5.6-sol": { input: 5, cached: 0.50, output: 30 },
    "gpt-5.6": { input: 5, cached: 0.50, output: 30 }
  };
  const p = prices[model];
  if (!p) return null;
  const tokenCost = (uncached / 1_000_000) * p.input + (cached / 1_000_000) * p.cached + (output / 1_000_000) * p.output;
  const searchCost = webSearchCalls * 0.01;
  return Number((tokenCost + searchCost).toFixed(6));
}

type ModelRun = {
  analysis: any;
  sources: Array<{ title: string; url: string }>;
  usage: any;
  webSearchCalls: number;
  latencyMs: number;
  estimatedCostUsd: number | null;
  model: string;
};

function criticalTextSignal(text: string) {
  return /(otp|doğrulama kodu|sms kodu|tek kullanımlık|şifre|parola|iban|havale|eft|usdt|btc|kripto|anydesk|teamviewer|uzaktan erişim|kart bilg|para gönder|kapora|güvenli hesap)/i.test(text);
}

function uniqueUrls(values: unknown[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const match = value.match(/https?:\/\/[^\s<>\"]+/i)?.[0];
    if (!match) continue;
    const cleaned = match.replace(/[),.;]+$/g, "");
    if (!seen.has(cleaned)) { seen.add(cleaned); out.push(cleaned); }
  }
  return out.slice(0, 3);
}

async function runOpenAI(args: {
  apiKey: string;
  model: string;
  type: "text" | "link" | "image";
  text: string;
  imageData?: string;
  useWeb: boolean;
  prior?: any;
}) : Promise<ModelRun> {
  const runStarted = Date.now();
  const visibleUrls = uniqueUrls([
    ...Array.from(args.text.matchAll(/https?:\/\/[^\s<>\"]+/gi)).map(m => m[0]),
    ...(Array.isArray(args.prior?.extractedUrls) ? args.prior.extractedUrls : [])
  ]);

  let prompt: string;
  if (args.type === "link") {
    prompt = `Bu URL için URL yapısını ve güncel harici risk sinyallerini birlikte değerlendir. Web aramasını mutlaka kullan. Exact domaini; domain + dolandırıcılık, scam, phishing ve şikayet sorgularını araştır. Marka çağrışımı varsa gerçek resmî alan adıyla karşılaştır. Hedef sitenin kendi içeriğini bağımsız güven kanıtı sayma; şikâyet platformlarını da kullanıcı bildirimi olarak etiketle. Kanıt yetersizse açıkça söyle ve güvenli olduğu sonucuna atlama. URL: ${args.text}\nDeterministik URL özellikleri: ${JSON.stringify(getUrlFacts(args.text))}`;
  } else if (args.type === "text") {
    prompt = `Bu mesajı dijital dolandırıcılık ve sosyal mühendislik risk sinyalleri açısından değerlendir:\n\n${args.text}`;
  } else {
    prompt = "Bu ekran görüntüsündeki metin ve görsel ipuçlarını dijital dolandırıcılık ve sosyal mühendislik risk sinyalleri açısından değerlendir. Görünen http/https bağlantılarını extractedUrls alanına çıkar. Kişisel verileri gereksiz yere sonuçta tekrar etme.";
  }

  if (args.prior) {
    prompt += `\n\nBu ikinci görüş analizidir. İlk hızlı modelin skoru ${args.prior.score}/100, seviyesi ${args.prior.level}, kanıt gücü ${args.prior.confidence}. İlk modelin bulduğu sinyaller: ${(args.prior.signals || []).join(" | ")}. İlk görüşü körü körüne kabul etme; bağımsız değerlendirme yap.`;
  }
  if (args.useWeb && visibleUrls.length) {
    prompt += `\n\nGörsel/metinde görülen bağlantılar: ${visibleUrls.join(" , ")}. Web aramasını kullanarak alan adlarını bağımsız doğrula; marka/resmî alan adı eşleşmesini ve güncel risk sinyallerini araştır. Hedef sitenin kendi beyanını bağımsız kanıt sayma.`;
  }

  const userContent: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
  if (args.type === "image" && args.imageData) userContent.push({ type: "input_image", image_url: args.imageData, detail: "auto" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.useWeb ? 50_000 : 35_000);
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: args.model,
        store: false,
        max_output_tokens: args.useWeb ? 1200 : 1000,
        ...(args.useWeb ? {
          tools: [{ type: "web_search", search_context_size: "medium", user_location: { type: "approximate", country: "TR", timezone: "Europe/Istanbul" } }],
          tool_choice: "required"
        } : {}),
        input: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userContent }],
        text: { format: { type: "json_schema", name: "guvencheck_risk_analysis", strict: true, schema } }
      })
    });
  } finally { clearTimeout(timeout); }

  if (!response.ok) {
    const detail = await response.text();
    console.error("OpenAI error:", response.status, detail.slice(0, 1200));
    throw new Error("OPENAI_REQUEST_FAILED");
  }
  const data = await response.json();
  const outputText = extractOutputText(data);
  if (!outputText) throw new Error("OPENAI_OUTPUT_MISSING");
  const analysis = sanitizeAnalysis(JSON.parse(outputText));
  const sources = args.useWeb ? extractWebSources(data) : [];
  const webSearchCalls = countWebSearchCalls(data);
  const usage = data?.usage || {};
  return {
    analysis,
    sources,
    usage,
    webSearchCalls,
    latencyMs: Date.now() - runStarted,
    estimatedCostUsd: estimateApiCost(args.model, usage, webSearchCalls),
    model: args.model
  };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 6_000_000) return NextResponse.json({ error: "Gönderilen içerik çok büyük." }, { status: 413 });

    const body = (await req.json()) as Payload;
    if (!body?.type || !["text", "link", "image"].includes(body.type)) return NextResponse.json({ error: "Geçersiz analiz türü." }, { status: 400 });

    let text = (body.content || "").trim();
    if (text.length > MAX_TEXT_LENGTH) return NextResponse.json({ error: "Metin çok uzun. En fazla 12.000 karakter gönderilebilir." }, { status: 400 });
    if (body.type === "link") {
      const normalized = normalizeHttpUrl(text);
      if (!normalized) return NextResponse.json({ error: "Geçerli bir alan adı veya bağlantı gir." }, { status: 400 });
      text = normalized;
    }

    const hasImage = body.type === "image" && typeof body.imageData === "string" && /^data:image\/(jpeg|png|webp);base64,/i.test(body.imageData);
    if (body.type === "image" && !hasImage) return NextResponse.json({ error: "Desteklenen bir ekran görüntüsü bulunamadı." }, { status: 400 });
    if (hasImage && body.imageData!.length > MAX_IMAGE_DATA_LENGTH) return NextResponse.json({ error: "Ekran görüntüsü işlendikten sonra hâlâ çok büyük." }, { status: 413 });
    if (!hasImage && text.length < 3) return NextResponse.json({ error: "Analiz edilecek içerik bulunamadı." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json(demoAnalyze(text || "ekran görüntüsü"));

    const fastModel = process.env.OPENAI_FAST_MODEL || "gpt-5.6-luna";
    const deepModel = process.env.OPENAI_DEEP_MODEL || process.env.OPENAI_MODEL || "gpt-5.6-terra";

    // Lab A/B çağrıları tek modeli doğrudan test eder; üretim çağrıları hibrit yönlendirmeyi kullanır.
    if (body.benchmarkModel) {
      const run = await runOpenAI({ apiKey, model: body.benchmarkModel, type: body.type, text, imageData: body.imageData, useWeb: body.type === "link" });
      const meta = {
        version: "0.5.0", model: run.model, route: "benchmark-direct", escalated: false,
        inputTokens: run.usage?.input_tokens ?? null, cachedInputTokens: run.usage?.input_tokens_details?.cached_tokens ?? 0,
        outputTokens: run.usage?.output_tokens ?? null, totalTokens: run.usage?.total_tokens ?? null,
        webSearchCalls: run.webSearchCalls, latencyMs: Date.now() - startedAt, estimatedCostUsd: run.estimatedCostUsd,
        calls: [{ model: run.model, costUsd: run.estimatedCostUsd, latencyMs: run.latencyMs, webSearchCalls: run.webSearchCalls }]
      };
      console.info("GUVENCHECK_USAGE", JSON.stringify({ type: body.type, ...meta }));
      return NextResponse.json({ ...run.analysis, sources: run.sources, mode: "ai", webVerified: body.type === "link" && run.webSearchCalls > 0, meta });
    }

    // Doğrudan link sorguları harici doğrulama gerektirdiği için kalite modeline gider.
    if (body.type === "link") {
      const run = await runOpenAI({ apiKey, model: deepModel, type: "link", text, useWeb: true });
      const meta = {
        version: "0.5.0", model: run.model, route: "terra-web", escalated: true, escalationReasons: ["link_web_verification"],
        inputTokens: run.usage?.input_tokens ?? null, cachedInputTokens: run.usage?.input_tokens_details?.cached_tokens ?? 0,
        outputTokens: run.usage?.output_tokens ?? null, totalTokens: run.usage?.total_tokens ?? null,
        webSearchCalls: run.webSearchCalls, latencyMs: Date.now() - startedAt, estimatedCostUsd: run.estimatedCostUsd,
        calls: [{ model: run.model, costUsd: run.estimatedCostUsd, latencyMs: run.latencyMs, webSearchCalls: run.webSearchCalls }]
      };
      console.info("GUVENCHECK_USAGE", JSON.stringify({ type: body.type, ...meta }));
      return NextResponse.json({ ...run.analysis, sources: run.sources, mode: "ai", webVerified: run.webSearchCalls > 0, meta });
    }

    const first = await runOpenAI({ apiKey, model: fastModel, type: body.type, text, imageData: body.imageData, useWeb: false });
    const firstAnalysis = first.analysis;
    const foundUrls = uniqueUrls(firstAnalysis.extractedUrls || []);
    const escalationReasons: string[] = [];
    if (firstAnalysis.score >= 25 && firstAnalysis.score <= 75) escalationReasons.push("gray_zone_score");
    if (firstAnalysis.confidence === "low") escalationReasons.push("low_confidence");
    if (body.type === "image" && foundUrls.length > 0) escalationReasons.push("image_contains_url");
    if (body.type === "text" && foundUrls.length > 0 && firstAnalysis.score < 85) escalationReasons.push("text_contains_url");
    if (body.type === "text" && criticalTextSignal(text) && firstAnalysis.score < 76) escalationReasons.push("critical_terms_need_review");

    const shouldEscalate = escalationReasons.length > 0;
    let finalRun = first;
    let second: ModelRun | null = null;
    if (shouldEscalate) {
      const useWeb = foundUrls.length > 0;
      second = await runOpenAI({ apiKey, model: deepModel, type: body.type, text, imageData: body.imageData, useWeb, prior: firstAnalysis });
      finalRun = second;
    }

    const calls = [first, ...(second ? [second] : [])];
    const totalCost = calls.reduce((sum, c) => sum + (c.estimatedCostUsd || 0), 0);
    const totalTokens = calls.reduce((sum, c) => sum + Number(c.usage?.total_tokens || 0), 0);
    const inputTokens = calls.reduce((sum, c) => sum + Number(c.usage?.input_tokens || 0), 0);
    const cachedTokens = calls.reduce((sum, c) => sum + Number(c.usage?.input_tokens_details?.cached_tokens || 0), 0);
    const outputTokens = calls.reduce((sum, c) => sum + Number(c.usage?.output_tokens || 0), 0);
    const webSearchCalls = calls.reduce((sum, c) => sum + c.webSearchCalls, 0);
    const meta = {
      version: "0.5.0",
      model: shouldEscalate ? `${fastModel} → ${deepModel}` : fastModel,
      route: shouldEscalate ? "hybrid-escalated" : "luna-fast-path",
      escalated: shouldEscalate,
      escalationReasons,
      firstPassScore: firstAnalysis.score,
      inputTokens, cachedInputTokens: cachedTokens, outputTokens, totalTokens, webSearchCalls,
      latencyMs: Date.now() - startedAt, estimatedCostUsd: Number(totalCost.toFixed(6)),
      calls: calls.map(c => ({ model: c.model, costUsd: c.estimatedCostUsd, latencyMs: c.latencyMs, webSearchCalls: c.webSearchCalls }))
    };
    console.info("GUVENCHECK_USAGE", JSON.stringify({ type: body.type, ...meta }));
    return NextResponse.json({
      ...finalRun.analysis,
      sources: finalRun.sources,
      mode: "ai",
      webVerified: finalRun.webSearchCalls > 0,
      meta
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return NextResponse.json({ error: "Analiz zaman aşımına uğradı. Lütfen tekrar dene." }, { status: 504 });
    if (error instanceof Error && (error.message === "OPENAI_REQUEST_FAILED" || error.message === "OPENAI_OUTPUT_MISSING")) {
      return NextResponse.json({ error: "AI analizi şu anda tamamlanamadı. Lütfen tekrar dene." }, { status: 502 });
    }
    console.error(error);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
