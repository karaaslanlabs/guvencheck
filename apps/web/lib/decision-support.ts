export type DecisionSupportInput = {
  level: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  verificationStatus?:
    | "not_checked"
    | "checked_no_strong_signal"
    | "checked_mixed"
    | "checked_risk_signals";
  actions?: readonly string[];
};

export type DecisionSupport = {
  uncertainty: "low" | "medium" | "high";
  uncertaintySummary: string;
  implication: string;
  nextAction: string;
};

const fallbackAction = {
  high: "İşlemi durdur ve ilgili kurumu kendi resmî kanalından doğrula.",
  medium: "İşlem yapmadan önce göndereni veya bağlantıyı bağımsız doğrula.",
  low: "Hassas işlem varsa ilgili kurumu kendi resmî kanalından son kez doğrula.",
} as const;
function uncertaintyFor(input: DecisionSupportInput): DecisionSupport["uncertainty"] {
  if (input.confidence === "low" || input.verificationStatus === "checked_mixed") return "high";
  if (input.verificationStatus === "not_checked" || input.verificationStatus === undefined) return "medium";
  if (input.confidence === "high") return "low";
  return "medium";
}

function uncertaintySummary(input: DecisionSupportInput) {
  if (input.verificationStatus === "checked_mixed") {
    return "Harici doğrulama karışık sinyaller verdi; kesin sonuca gitmek için ek doğrulama gerekiyor.";
  }
  if (input.verificationStatus === "checked_risk_signals") {
    return "Harici doğrulama risk sinyallerini destekliyor; bu yine de kesin hüküm değildir.";
  }
  if (input.verificationStatus === "checked_no_strong_signal") {
    return "Harici doğrulamada güçlü ek risk sinyali bulunmadı; bu içerik kesin güvenli demek değildir.";
  }
  return "Harici doğrulama tamamlanmadı; sonuç içerikte görülen risk sinyallerine dayanıyor.";
}
function implicationFor(level: DecisionSupportInput["level"]) {
  if (level === "high") {
    return "Bu içerikle ilgili ödeme, bilgi paylaşımı veya hesap işlemini şu aşamada ilerletme.";
  }
  if (level === "medium") {
    return "Karar vermeden veya hassas işlem yapmadan önce talebi bağımsız doğrula.";
  }
  return "Belirgin risk sinyali az; hassas işlem varsa son doğrulamayı resmî kanaldan yap.";
}

export function deriveDecisionSupport(input: DecisionSupportInput): DecisionSupport {
  const nextAction = input.actions?.find((item) => item.trim().length > 0) ?? fallbackAction[input.level];
  return {
    uncertainty: uncertaintyFor(input),
    uncertaintySummary: uncertaintySummary(input),
    implication: implicationFor(input.level),
    nextAction,
  };
}

export function withDecisionSupport<T extends DecisionSupportInput>(analysis: T): T & { decisionSupport: DecisionSupport } {
  return { ...analysis, decisionSupport: deriveDecisionSupport(analysis) };
}
