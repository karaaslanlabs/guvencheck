import {
  TRUST_GRAPH_SEED,
  findClaimedEntities,
  isOfficialDomainForEntity,
  lookupOfficialDomain,
  type TrustGraphEntity,
} from "./trust-graph.ts";

export type TransactionGuardDecision = "not_applicable" | "stop" | "verify" | "proceed_cautiously";

export type TransactionGuardEvidence = {
  kind: "official_domain_match" | "claimed_entity_mismatch" | "regulated_entity" | "analysis_risk";
  label: string;
  sourceAuthority?: string;
  sourceUrl?: string;
};

export type TransactionGuardResult = {
  applicable: boolean;
  decision: TransactionGuardDecision;
  confidence: "low" | "medium" | "high";
  summary: string;
  safeAction: string;
  evidence: TransactionGuardEvidence[];
};

type GuardAnalysis = {
  level?: "low" | "medium" | "high";
  confidence?: "low" | "medium" | "high";
  title?: string;
  summary?: string;
  signals?: readonly string[];
  actions?: readonly string[];
  extractedUrls?: readonly string[];
};

const TRANSACTION_RE = /(ödeme|para gönder|iban|eft|havale|kart bilg|kredi kart|kapora|satıcı|mağaza|alışveriş|sipariş|checkout|yatırım|kripto|hesap doğrula|kimlik|tc kimlik|şifre|otp|doğrulama kodu)/i;
const MATERIAL_ACTION_RE = /(para gönder|ödeme yap|iban|eft|havale|kapora|kart bilg|kredi kart|şifre|otp|doğrulama kodu|kimlik|tc kimlik|hesap aç|yatırım yap)/i;

function evidenceText(text: string, analysis: GuardAnalysis) {
  return [
    text,
    analysis.title || "",
    analysis.summary || "",
    ...(analysis.signals || []),
    ...(analysis.actions || []),
  ].join(" ");
}

function extractUrls(text: string, analysis: GuardAnalysis) {
  const values = [
    ...Array.from(text.matchAll(/https?:\/\/[^\s<>\"]+/gi)).map((match) => match[0]),
    ...(analysis.extractedUrls || []),
  ];
  return Array.from(new Set(values.map((value) => value.replace(/[),.;]+$/g, "")))).slice(0, 4);
}

function officialEvidence(entity: TrustGraphEntity): TransactionGuardEvidence {
  return {
    kind: "regulated_entity",
    label: `${entity.name} için doğrulanmış kurum kaydı bulundu; bu tek başına işlemin güvenli olduğunu kanıtlamaz.`,
    sourceAuthority: entity.source.authority,
    sourceUrl: entity.source.url,
  };
}

function fallbackResult(): TransactionGuardResult {
  return {
    applicable: false,
    decision: "not_applicable",
    confidence: "low",
    summary: "Bu içerikte belirgin bir ödeme, kimlik veya işlem kararı bağlamı bulunmadı.",
    safeAction: "Hassas bir işlem varsa kurumu kendi resmî kanalından ayrıca doğrula.",
    evidence: [],
  };
}

export function deriveTransactionGuard(input: {
  text: string;
  analysis: GuardAnalysis;
  records?: readonly TrustGraphEntity[];
  now?: Date;
}): TransactionGuardResult {
  const records = input.records ?? TRUST_GRAPH_SEED;
  const now = input.now ?? new Date();
  const combined = evidenceText(input.text, input.analysis);
  const transactionContext = TRANSACTION_RE.test(combined);
  const materialAction = MATERIAL_ACTION_RE.test(combined);
  const urls = extractUrls(input.text, input.analysis);
  const claimed = findClaimedEntities(combined, records, now);
  const officialMatches = urls.map((url) => ({ url, entity: lookupOfficialDomain(url, records, now) })).filter((item) => item.entity);

  if (!transactionContext && claimed.length === 0 && officialMatches.length === 0) return fallbackResult();

  const evidence: TransactionGuardEvidence[] = [];
  if (input.analysis.level === "high") {
    evidence.push({ kind: "analysis_risk", label: "Mevcut analiz güçlü risk sinyalleri gösteriyor." });
  }

  for (const entity of claimed.slice(0, 2)) evidence.push(officialEvidence(entity));
  for (const match of officialMatches.slice(0, 2)) {
    evidence.push({
      kind: "official_domain_match",
      label: `${match.entity!.name} için görülen alan adı doğrulanmış resmî alan adıyla eşleşiyor; bu yine de talebin bütünüyle güvenli olduğu anlamına gelmez.`,
      sourceAuthority: match.entity!.source.authority,
      sourceUrl: match.entity!.source.url,
    });
  }

  const mismatches = claimed.filter((entity) => urls.length > 0 && !urls.some((url) => isOfficialDomainForEntity(url, entity)));
  for (const entity of mismatches.slice(0, 2)) {
    evidence.push({
      kind: "claimed_entity_mismatch",
      label: `${entity.name} iddiası var ancak görülen bağlantı kurumun doğrulanmış resmî alan adlarıyla eşleşmiyor.`,
      sourceAuthority: entity.source.authority,
      sourceUrl: entity.source.url,
    });
  }

  if (input.analysis.level === "high" || (mismatches.length > 0 && materialAction)) {
    return {
      applicable: true,
      decision: "stop",
      confidence: mismatches.length > 0 || input.analysis.confidence === "high" ? "high" : "medium",
      summary: "İşlem veya bilgi paylaşımı öncesinde durmak için yeterli risk işareti var.",
      safeAction: "Mesajdaki bağlantı veya numarayı kullanma. İlgili kurumun resmî uygulamasını ya da doğrulanmış resmî alan adını kendin açarak işlemi yeniden başlat.",
      evidence: evidence.slice(0, 5),
    };
  }

  if (mismatches.length > 0 || materialAction || input.analysis.level === "medium") {
    return {
      applicable: true,
      decision: "verify",
      confidence: mismatches.length > 0 ? "high" : "medium",
      summary: "Para, kimlik veya hesap işlemi öncesinde bağımsız doğrulama gerekiyor.",
      safeAction: "İşlemi gönderen kanalın dışına çıkarak kurumun kendi resmî uygulaması, sitesi veya doğrulanmış müşteri hizmetleri kanalından kontrol et.",
      evidence: evidence.slice(0, 5),
    };
  }

  if (officialMatches.length > 0 && input.analysis.level === "low") {
    return {
      applicable: true,
      decision: "proceed_cautiously",
      confidence: "medium",
      summary: "Resmî alan adıyla uyumlu bir sinyal var ve belirgin risk düşük; bu yine de işlem güvenliği garantisi değildir.",
      safeAction: "Hassas bilgi veya para hareketi varsa son doğrulamayı kurumun kendi uygulamasından yap.",
      evidence: evidence.slice(0, 5),
    };
  }

  return {
    applicable: true,
    decision: "verify",
    confidence: "low",
    summary: "İşlem bağlamı var ancak güvenli karar için yeterli doğrulanmış sinyal yok.",
    safeAction: "Ödeme veya bilgi paylaşımından önce kurum/işletme ve kullanılan kanalı bağımsız doğrula.",
    evidence: evidence.slice(0, 5),
  };
}
