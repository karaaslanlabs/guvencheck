# V0.6 Deploy

1. `guvencheck-v0.6` klasörünü GitHub reposuna yükle.
2. Vercel > Project Settings > Build and Deployment > Root Directory: `guvencheck-v0.6`
3. Environment Variables mevcut kalsın:
   - `OPENAI_API_KEY`
   - varsa `OPENAI_FAST_MODEL=gpt-5.6-luna`
   - varsa `OPENAI_DEEP_MODEL=gpt-5.6-terra`
4. Save ve Redeploy.
5. `/api/health` çıktısında `version: 0.6.0` doğrula.
6. Ana sayfada bir mesaj ve bir ekran görüntüsü analizi yap.
7. Sonuç ekranındaki geri bildirim kutusunu test et.
8. `/privacy` sayfasını aç.

Not: V0.6 rate limit'i serverless bellek üzerinde best-effort çalışır; public lansman için kalıcı dağıtık limit değildir.
