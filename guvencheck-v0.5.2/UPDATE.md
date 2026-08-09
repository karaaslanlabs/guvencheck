# V0.5.2 değişiklikleri

- Structured output parse/eksik çıktı artık bir kez otomatik yeniden denenir.
- Web doğrulamalı ikinci aşama için çıktı bütçesi yükseltildi.
- Terra/web ikinci aşaması başarısız olursa tüm analiz 500 vermek yerine Luna ilk analizine güvenli fallback yapılır.
- Fallback durumunda harici doğrulama yapılmış gibi gösterilmez.
- Loglarda `GUVENCHECK_ESCALATION_FALLBACK` ve request ID tutulur.
