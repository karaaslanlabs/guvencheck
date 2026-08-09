# GüvenCheck V0.3 — Kod bilmeden yayınlama

## A) GitHub'a yükle
1. GitHub'da sağ üstte `+` → **New repository**.
2. Repository name: `guvencheck`.
3. İlk test için **Private** seçebilirsin.
4. README / .gitignore / license ekletme; boş repo oluştur.
5. Bu ZIP'i bilgisayarında klasöre çıkar.
6. GitHub reposunda **Add file → Upload files**.
7. `guvencheck-v0.3` klasörünün İÇİNDEKİ tüm dosya ve klasörleri yükleme alanına sürükle. Repo kökünde `package.json`, `app`, `public` görünmeli; fazladan `guvencheck-v0.3/` üst klasörü olmamalı.
8. Altta **Commit changes**.

> `.env.example` yüklenebilir; gerçek API anahtarını ASLA GitHub'a yükleme.

## B) Vercel'e bağla
1. Vercel dashboard → **Add New → Project**.
2. GitHub bağlantısında `guvencheck` reposunu seç → **Import**.
3. Framework Preset otomatik **Next.js** olmalı.
4. Root Directory: repo kökü (`./`).
5. **Environment Variables** bölümüne:
   - Name: `OPENAI_API_KEY`
   - Value: OpenAI Platform'da oluşturduğun gizli anahtar
6. İkinci değişken:
   - Name: `OPENAI_MODEL`
   - Value: `gpt-5.6-terra`
7. **Deploy**.

## C) Canlı AI kontrolü
Deploy tamamlandığında Vercel sana `https://...vercel.app` adresi verir.

1. Önce `https://SENIN-ADRESIN.vercel.app/api/health` aç.
2. Şuna benzer yanıt beklenir:
   `{"ok":true,"aiConfigured":true,"version":"0.3.0"}`
3. `aiConfigured:false` ise API anahtarı Vercel'e ulaşmamıştır. Project → Settings → Environment Variables'ı kontrol et ve production deployment'ı redeploy et.
4. Ana sayfada test mesajını yapıştır:
   `Hesabınız askıya alınacaktır. Hemen ödeme yapın ve SMS doğrulama kodunuzu paylaşın.`
5. Sonuç altında **AI analizi** ibaresi görünmeli; **Demo modu** görünüyorsa anahtar bağlı değildir.
6. Sonra gerçek bir şüpheli SMS ekran görüntüsüyle görsel testi yap.

## D) OpenAI tarafı
- OpenAI Platform'da billing/credit etkin olmalı.
- API anahtarını yalnızca Vercel Environment Variables'a gir.
- Anahtarı ChatGPT mesajına, GitHub dosyasına veya ekran görüntüsüne koyma.

## İlk deploy sonrası
Canlı Vercel adresini ChatGPT'ye gönder. Sonraki adımda canlı ürünü birlikte test edip hataları V0.3.1'de düzelteceğiz.
