export type DeepVerificationInput = {
  level: "low" | "medium" | "high";
  confidence?: "low" | "medium" | "high";
  verificationStatus?: "not_checked" | "checked_no_strong_signal" | "checked_mixed" | "checked_risk_signals";
  decisionSupport?: { uncertainty?: "low" | "medium" | "high" };
};

export type DeepVerificationOpportunity = {
  eligible: boolean;
  reason: string;
};

export function deriveDeepVerification(input: DeepVerificationInput): DeepVerificationOpportunity {
  if (input.level === "low") return { eligible: false, reason: "" };
  const uncertainty = input.decisionSupport?.uncertainty ?? (input.confidence === "low" ? "high" : "medium");
  const evidenceGap = !input.verificationStatus || input.verificationStatus === "not_checked" || input.verificationStatus === "checked_mixed";
  const eligible = uncertainty === "high" || (uncertainty === "medium" && evidenceGap);
  if (!eligible) return { eligible: false, reason: "" };
  return {
    eligible: true,
    reason: uncertainty === "high"
      ? "Bu vakada belirsizlik yüksek; ek kanıtlar kararını anlamlı biçimde değiştirebilir."
      : "Mevcut bulgular karışık veya sınırlı; ek kaynaklarla daha derin doğrulama anlamlı olabilir.",
  };
}
