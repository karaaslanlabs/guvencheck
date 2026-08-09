import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 12_000;
const MAX_IMAGE_DATA_LENGTH = 5_500_000;

type Payload = {
  type: "text" | "link" | "image";
  content?: string;
  imageData?: string;
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
    confidence: { type: "string", enum: ["low", "medium", "high"] }
  },
  required: ["score", "level", "title", "summary", "signals", "actions", "avoid", "confidence"]
};

const SYSTEM_PROMPT = `Sen GüvenCheck adlı Türkiye odaklı dijital güven asistanının risk analiz motorusun.
Görevin kullanıcı tarafından verilen mesaj, URL veya ekran görüntüsünde dolandırıcılık, kimlik avı, sosyal mühendislik, sahte kurum, ödeme baskısı ve şüpheli ticaret sinyallerini değerlendirmektir.

Kurallar:
- Kesin hüküm verme. "Dolandırıcıdır" veya "kesin güvenlidir" deme. Risk sinyali ve olasılık dili kullan.
- Kanıt yoksa kişi veya kurum hakkında suç isnadı yapma.
- Resmî kurum, banka, kargo, icra, HGS, vergi, e-Devlet, yatırım, iş teklifi, kapora, sahte destek ve alışveriş taklitlerine dikkat et.
- Aciliyet, korku, gizlilik talebi, OTP/şifre isteme, uzaktan erişim uygulaması kurdurma, alışılmadık ödeme yöntemi, IBAN/kripto transferi, link alan adı tutarsızlığı ve gerçek dışı vaatleri güçlü sinyal say.
- URL için gerçek zamanlı itibar, WHOIS veya site içeriği sorgusu yapmıyorsun. Bunları doğrulamış gibi konuşma; yalnızca verilen URL yapısı ve metindeki sinyaller üzerinden çıkarım yap.
- Görselde kişisel veri varsa analiz için gerekmeyen kısmını sonuçta tekrar etme.
- Skoru sinyal sayısına göre mekanik verme: sinyallerin şiddetini ve birlikte görülmesini değerlendir.
- Sonuç Türkçe, kısa, sakin ve eyleme dönük olsun.
- Yüksek riskte para göndermeme, linke tıklamama, OTP/şifre paylaşmama ve kurumu mesajdaki kanal yerine kendi resmî sitesi/uygulaması/numarasından doğrulama tavsiyesi ver.
- Düşük risk sonucu bile içeriğin kesin güvenli olduğu anlamına gelmez.
- Kullanıcı için en kritik 3-5 sinyali öne çıkar; aynı şeyi farklı cümlelerle tekrarlama.`;

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 6_000_000) {
      return NextResponse.json({ error: "Gönderilen içerik çok büyük." }, { status: 413 });
    }

    const body = (await req.json()) as Payload;
    if (!body?.type || !["text", "link", "image"].includes(body.type)) {
      return NextResponse.json({ error: "Geçersiz analiz türü." }, { status: 400 });
    }

    const text = (body.content || "").trim();
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Metin çok uzun. En fazla 12.000 karakter gönderilebilir." }, { status: 400 });
    }

    if (body.type === "link" && !isValidHttpUrl(text)) {
      return NextResponse.json({ error: "Lütfen http:// veya https:// ile başlayan geçerli bir bağlantı gir." }, { status: 400 });
    }

    const hasImage = body.type === "image" && typeof body.imageData === "string" && /^data:image\/(jpeg|png|webp);base64,/i.test(body.imageData);
    if (body.type === "image" && !hasImage) {
      return NextResponse.json({ error: "Desteklenen bir ekran görüntüsü bulunamadı." }, { status: 400 });
    }
    if (hasImage && body.imageData!.length > MAX_IMAGE_DATA_LENGTH) {
      return NextResponse.json({ error: "Ekran görüntüsü işlendikten sonra hâlâ çok büyük." }, { status: 413 });
    }
    if (!hasImage && text.length < 3) {
      return NextResponse.json({ error: "Analiz edilecek içerik bulunamadı." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json(demoAnalyze(text || "ekran görüntüsü"));

    const userContent: Array<Record<string, unknown>> = [
      {
        type: "input_text",
        text: body.type === "link"
          ? `Bu URL'yi yalnızca verilen URL yapısı ve görünen risk sinyalleri açısından değerlendir. Gerçek zamanlı site/WHOIS itibarı sorguladığını varsayma:\n${text}`
          : body.type === "text"
            ? `Bu mesajı dijital dolandırıcılık ve sosyal mühendislik risk sinyalleri açısından değerlendir:\n\n${text}`
            : "Bu ekran görüntüsündeki metin ve görsel ipuçlarını dijital dolandırıcılık ve sosyal mühendislik risk sinyalleri açısından değerlendir. Kişisel verileri gereksiz yere sonuçta tekrar etme."
      }
    ];

    if (hasImage) userContent.push({ type: "input_image", image_url: body.imageData, detail: "auto" });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
          store: false,
          max_output_tokens: 1200,
          input: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "guvencheck_risk_analysis",
              strict: true,
              schema
            }
          }
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI error:", response.status, detail.slice(0, 1200));
      return NextResponse.json({ error: "AI analizi şu anda tamamlanamadı. Lütfen tekrar dene." }, { status: 502 });
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    if (!outputText) return NextResponse.json({ error: "AI yanıtı okunamadı." }, { status: 502 });

    const parsed = JSON.parse(outputText);
    return NextResponse.json({ ...parsed, mode: "ai" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Analiz zaman aşımına uğradı. Lütfen tekrar dene." }, { status: 504 });
    }
    console.error(error);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
