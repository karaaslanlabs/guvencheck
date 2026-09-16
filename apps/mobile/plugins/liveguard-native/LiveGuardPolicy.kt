package com.guvencheck.app.liveguard

data class NativeLiveGuardAssessment(
  val decision: String,
  val confidence: String,
  val reasonCodes: List<String>,
)

object LiveGuardPolicy {
  private val credential = Regex("(otp|doğrulama kodu|sms kodu|tek kullanımlık|şifre|parola|kart bilg|cvv)", RegexOption.IGNORE_CASE)
  private val payment = Regex("(iban|havale|eft|para gönder|ödeme yap|kapora|kripto|usdt|btc|güvenli hesap)", RegexOption.IGNORE_CASE)
  private val remote = Regex("(anydesk|teamviewer|uzaktan erişim|ekran paylaş)", RegexOption.IGNORE_CASE)
  private val urgency = Regex("(acil|hemen|son uyarı|son gün|askıya alın|kapatılacak|yasal işlem|haciz|ceza)", RegexOption.IGNORE_CASE)
  private val authority = Regex("(banka|bankası|e-devlet|polis|savcı|jandarma|vergi|icra|ptt|kargo|bakanlık)", RegexOption.IGNORE_CASE)
  private val reward = Regex("(kazandınız|çekiliş|bedava|garanti kazanç|risksiz kazanç|yüksek getiri)", RegexOption.IGNORE_CASE)
  private val shortener = Regex("(bit\\.ly|tinyurl\\.com|t\\.co|cutt\\.ly|is\\.gd)", RegexOption.IGNORE_CASE)
  private val url = Regex("https?://[^\\s<>\"]+", RegexOption.IGNORE_CASE)

  fun assess(title: String?, text: String?): NativeLiveGuardAssessment {
    val combined = "${title.orEmpty()} ${text.orEmpty()}".trim()
    val reasons = mutableListOf<String>()
    val hasUrl = url.containsMatchIn(combined)
    if (credential.containsMatchIn(combined)) reasons += "credential_request"
    if (payment.containsMatchIn(combined)) reasons += "payment_redirect"
    if (remote.containsMatchIn(combined)) reasons += "remote_access"
    if (urgency.containsMatchIn(combined) && authority.containsMatchIn(combined)) reasons += "urgent_authority_claim"
    if (hasUrl && shortener.containsMatchIn(combined)) reasons += "suspicious_link"
    if (reward.containsMatchIn(combined)) reasons += "too_good_to_be_true"

    val materialAction = reasons.any { it in setOf("credential_request", "payment_redirect", "remote_access") }
    val highConfidence = "remote_access" in reasons ||
      ("urgent_authority_claim" in reasons && materialAction) ||
      (reasons.size >= 2 && materialAction)

    if (highConfidence) return NativeLiveGuardAssessment("warn", "high", reasons)
    if (reasons.isNotEmpty() || hasUrl) {
      return NativeLiveGuardAssessment(
        "review",
        if (reasons.isNotEmpty()) "medium" else "low",
        reasons,
      )
    }
    return NativeLiveGuardAssessment("ignore", "low", emptyList())
  }
}
