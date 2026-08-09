# GüvenCheck V0.6 — Profesyonel beta temeli

V0.6, model benchmark döneminden ilk kapalı beta hazırlığına geçiş sürümüdür.

## Yeni
- Best-effort sunucu rate limit: IP başına yaklaşık 30 analiz/saat. Serverless örnekleri arasında tam dağıtık garanti sağlamaz; halka açık lansman öncesi kalıcı rate-limit altyapısına taşınmalıdır.
- Tüm analiz cevaplarında `Cache-Control: no-store` ve rate-limit başlıkları.
- Sonuç ekranında anonim “Bu sonuç işine yaradı mı?” geri bildirimi.
- `/api/feedback`: mesaj/görsel içeriğini değil; yalnızca sonuç kalitesi, analiz türü, skor, seviye, rota ve request ID gibi ürün sinyallerini Vercel loglarına yazar.
- `/privacy`: beta gizlilik ve veri kullanımı özeti.
- UI üzerinde Beta etiketi ve gizlilik bağlantısı.

## Değişmeyen çekirdek
- Luna hızlı yol + Terra gerektiğinde ikinci görüş.
- Link sorgularında Terra + web araştırması.
- Görselde URL bulunursa gerektiğinde web doğrulaması.
- Retry / structured-output fallback mekanizması.

## Üretim öncesi hâlâ gerekli
- Dağıtık rate limit (ör. Redis/KV tabanlı)
- Kalıcı ama minimum veri analitiği
- KVKK aydınlatma metni / kullanım şartları
- Kötüye kullanım ve bot koruması
- Gerçek beta kullanıcılarıyla doğruluk/retention ölçümü
