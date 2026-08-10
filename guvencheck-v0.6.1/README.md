# GüvenCheck V0.6.1

Türkiye odaklı, AI destekli dijital risk kontrol asistanı. Mesaj, link ve ekran görüntülerindeki dolandırıcılık / phishing / sosyal mühendislik sinyallerini değerlendirir.

## V0.6.1 beta mimarisi
- Mesaj/görsel ilk geçiş: `gpt-5.6-luna`
- Gri/kritik vakalar: `gpt-5.6-terra` ikinci görüş
- Doğrudan link: Terra + web search
- Görselde URL: gerektiğinde Terra + web doğrulaması
- Retry + güvenli fallback
- Best-effort rate limit
- Anonim sonuç geri bildirimi
- `/privacy` beta şeffaflık sayfası
- `/lab` kalite ve maliyet test alanı

## Environment variables
`OPENAI_API_KEY` zorunlu.

Opsiyonel:
- `OPENAI_FAST_MODEL=gpt-5.6-luna`
- `OPENAI_DEEP_MODEL=gpt-5.6-terra`

## Uyarı
GüvenCheck kesin dolandırıcılık veya kesin güvenlik kararı vermez. Halka açık ticari lansmandan önce KVKK, dağıtık rate limit, kalıcı analitik, bot koruması ve hukuki metinler tamamlanmalıdır.

## V0.6.1 kapalı beta notları

Son kullanıcı arayüzünde Lab ve maliyet/test metrikleri gösterilmez. Dahili Lab varsayılan olarak kapalıdır.

Dahili Lab kullanmak istersen Vercel Environment Variables'a `LAB_ACCESS_KEY` ekle. `/lab` açılırken tarayıcı Basic Auth ister; kullanıcı adı herhangi bir değer olabilir, parola `LAB_ACCESS_KEY` olmalıdır. Anahtar tanımlı değilse `/lab` 404 döndürür.
