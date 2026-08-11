# GüvenCheck V0.8.3 — Kapalı Beta

Türkiye odaklı dijital risk analizi. Mesaj, link ve ekran görüntüsünü Luna → gerektiğinde Terra + web doğrulama hibrit hattıyla değerlendirir.

## V0.8.3
- Lab son kullanıcıdan gizli, erişim anahtarı yoksa 404.
- Opsiyonel `BETA_ACCESS_KEY` ile tüm kapalı beta parola korumalı olabilir.
- İçerik saklamadan anonim ürün telemetrisi (`GUVENCHECK_EVENT`).
- Evet/Hayır geri bildiriminde Hayır için neden seçimi.
- Paylaşım ve analiz tamamlanma olayları ölçülür.

## Environment
`OPENAI_API_KEY` zorunlu. `OPENAI_MODEL` mevcut kurulumla kullanılabilir. `BETA_ACCESS_KEY` ve `LAB_ACCESS_KEY` opsiyoneldir.
