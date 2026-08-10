# V0.6.1 Deploy

1. `guvencheck-v0.6` klasörünü GitHub reposuna yükle.
2. Vercel > Project Settings > Build and Deployment > Root Directory: `guvencheck-v0.6`
3. Environment Variables mevcut kalsın:
   - `OPENAI_API_KEY`
   - varsa `OPENAI_FAST_MODEL=gpt-5.6-luna`
   - varsa `OPENAI_DEEP_MODEL=gpt-5.6-terra`
4. Save ve Redeploy.
5. `/api/health` çıktısında `version: 0.6.1` doğrula.
6. Ana sayfada bir mesaj ve bir ekran görüntüsü analizi yap.
7. Sonuç ekranındaki geri bildirim kutusunu test et.
8. `/privacy` sayfasını aç.

Not: V0.6.1 rate limit'i serverless bellek üzerinde best-effort çalışır; public lansman için kalıcı dağıtık limit değildir.

## V0.6.1 — Lab erişimi

Üretim beta kullanıcılarının Lab'a girmemesi için `/lab` korumalıdır.

Vercel > Project > Settings > Environment Variables:
- `LAB_ACCESS_KEY`: yalnızca proje sahibinin bildiği güçlü bir parola (isteğe bağlı)

Bu değişkeni eklemezsen `/lab` kapalı kalır ve 404 verir. Eklediysen yeniden deploy et. Lab açılırken tarayıcı kullanıcı adı/parola ister; kullanıcı adı önemli değildir, parola `LAB_ACCESS_KEY` değeridir.
