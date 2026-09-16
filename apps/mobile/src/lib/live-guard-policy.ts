export type LiveGuardDecision = 'ignore' | 'review' | 'warn';

export type LiveGuardReason =
  | 'credential_request'
  | 'payment_redirect'
  | 'remote_access'
  | 'urgent_authority_claim'
  | 'suspicious_link'
  | 'too_good_to_be_true';

export type LiveGuardAssessment = {
  decision: LiveGuardDecision;
  confidence: 'low' | 'medium' | 'high';
  reasonCodes: LiveGuardReason[];
  urlCount: number;
  materialAction: boolean;
  explicitReviewRequired: boolean;
};

const CREDENTIAL_RE = /(otp|doğrulama kodu|sms kodu|tek kullanımlık|şifre|parola|kart bilg|cvv)/i;
const PAYMENT_RE = /(iban|havale|eft|para gönder|ödeme yap|kapora|kripto|usdt|btc|güvenli hesap)/i;
const REMOTE_ACCESS_RE = /(anydesk|teamviewer|uzaktan erişim|ekran paylaş)/i;
const URGENCY_RE = /(acil|hemen|son uyarı|son gün|askıya alın|kapatılacak|yasal işlem|haciz|ceza)/i;
const AUTHORITY_RE = /(banka|bankası|e-devlet|polis|savcı|jandarma|vergi|icra|ptt|kargo|bakanlık)/i;
const REWARD_RE = /(kazandınız|çekiliş|bedava|garanti kazanç|risksiz kazanç|yüksek getiri)/i;
const SHORTENER_RE = /(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|is\.gd)/i;
function countUrls(value: string) {
  return Array.from(value.matchAll(/https?:\/\/[^\s<>\"]+/gi)).length;
}

export function assessLiveMessage(input: { title?: string; text?: string }): LiveGuardAssessment {
  const combined = `${input.title || ''} ${input.text || ''}`.trim();
  const reasonCodes: LiveGuardReason[] = [];
  const urlCount = countUrls(combined);

  if (CREDENTIAL_RE.test(combined)) reasonCodes.push('credential_request');
  if (PAYMENT_RE.test(combined)) reasonCodes.push('payment_redirect');
  if (REMOTE_ACCESS_RE.test(combined)) reasonCodes.push('remote_access');
  if (URGENCY_RE.test(combined) && AUTHORITY_RE.test(combined)) reasonCodes.push('urgent_authority_claim');
  if (urlCount > 0 && SHORTENER_RE.test(combined)) reasonCodes.push('suspicious_link');
  if (REWARD_RE.test(combined)) reasonCodes.push('too_good_to_be_true');

  const materialAction = reasonCodes.some((reason) =>
    ['credential_request', 'payment_redirect', 'remote_access'].includes(reason),
  );
  const highConfidence = reasonCodes.includes('remote_access')
    || (reasonCodes.includes('urgent_authority_claim') && materialAction)
    || (reasonCodes.length >= 2 && materialAction);

  if (highConfidence) {
    return { decision: 'warn', confidence: 'high', reasonCodes, urlCount, materialAction, explicitReviewRequired: true };
  }
  const needsReview = reasonCodes.length > 0 || urlCount > 0;
  if (needsReview) {
    return {
      decision: 'review',
      confidence: reasonCodes.length > 0 ? 'medium' : 'low',
      reasonCodes,
      urlCount,
      materialAction,
      explicitReviewRequired: true,
    };
  }

  return {
    decision: 'ignore',
    confidence: 'low',
    reasonCodes: [],
    urlCount: 0,
    materialAction: false,
    explicitReviewRequired: false,
  };
}
