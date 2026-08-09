# GüvenCheck V0.3

Türkiye için mobil öncelikli dijital risk kontrol MVP'si.

## V0.3'te çalışan akış
- Mesaj analizi
- HTTP/HTTPS link analizi ve giriş doğrulama
- JPG / PNG / WEBP ekran görüntüsü analizi
- Görseli tarayıcıda en fazla 1800 px'e küçültme ve JPEG olarak yeniden kodlama
- 0–100 risk skoru
- Tespit edilen risk sinyalleri
- Yapılması / yapılmaması gerekenler
- Web Share API ile “Aileme gönder”
- Desteklenen cihazlarda görsel sonuç kartı paylaşımı
- `OPENAI_API_KEY` yoksa demo/heuristic modu
- Anahtar varsa OpenAI Responses API + görsel girdi + Structured Outputs
- `/api/health` sağlık kontrol endpoint'i
- PWA manifest

## Teknoloji
- Next.js 16.3+
- React 19.2+
- TypeScript
- OpenAI Responses API
- Vercel uyumlu serverless deploy

## Lokal çalıştırma
1. Node.js 20+ kurulu olmalı.
2. Proje klasöründe `npm install`
3. `.env.example` dosyasını `.env.local` olarak kopyala.
4. Gerçek AI için `OPENAI_API_KEY` değerini ekle. Boş bırakırsan demo modunda çalışır.
5. `npm run dev`
6. Tarayıcı: `http://localhost:3000`

## Vercel'e yayınlama
1. Bu klasörü bir GitHub reposuna yükle.
2. Vercel'de `Add New > Project` ile repoyu seç.
3. Project Settings > Environment Variables içine `OPENAI_API_KEY` ekle.
4. İsteğe bağlı olarak `OPENAI_MODEL=gpt-5.6-terra` ekle.
5. Deploy et. Environment variable sonradan değiştirilirse yeniden deploy gerekir.

## Güvenlik / gizlilik tasarımı
- “Bu dolandırıcıdır” gibi kesin suç isnadı yok.
- “Kesin güvenli” sonucu yok; düşük risk bile sınırlı bir değerlendirmedir.
- Kişisel veriler sonuçta gereksiz tekrar edilmez.
- OpenAI API çağrısında `store:false` kullanılır.
- V0.3 kullanıcı girdisini kendi veritabanımızda saklamaz.
- Tarayıcı ekran görüntüsünü yeniden kodlayarak dosya metadata'sının önemli bölümünü kaldırır ve boyutu küçültür.
- İstek gövdesi, metin ve görsel boyutları ayrıca sınırlandırılır.
- API çağrısı 35 saniyede zaman aşımına uğrar.
- Bu sürüm gerçek zamanlı URL reputation / WHOIS / domain yaşı / banka veya kurum doğrulaması yapmaz.

## Bilinen sınırlar
- AI hata yapabilir veya görseldeki bazı ayrıntıları kaçırabilir.
- URL modülü sayfanın içeriğini açmaz; yalnızca URL yapısını ve kullanıcının verdiği içeriği analiz eder.
- Kötü niyetli kullanıcıların API maliyeti oluşturmasını önlemek için public beta öncesi rate limiting eklenmelidir.
- Gerçek kullanıcılara açılmadan önce KVKK metinleri, gizlilik politikası ve kullanım koşulları hazırlanmalıdır.

## Yayın sonrası sıradaki işler
1. İlk gerçek Vercel deploy ve AI smoke testi.
2. 30–50 örnekli eval seti ve skor kalibrasyonu.
3. Rate limiting / abuse koruması.
4. Anonim “Faydalı mıydı?” geri bildirimi.
5. Gerçek URL metadata/reputation katmanı.
6. İlk 20 gerçek kullanıcı testi.

## Not
Bu bir erken ürün MVP'sidir. Yüksek riskli finansal veya hukuki kararlar için tek doğrulama kaynağı olarak kullanılmamalıdır.


## V0.3 ekleri
- PWA/uygulama ikonu
- Temel güvenlik HTTP başlıkları
- AI yanıtı için 1200 output-token üst sınırı
- Kod bilmeden GitHub → Vercel yayınlama kılavuzu (`DEPLOY.md`)
