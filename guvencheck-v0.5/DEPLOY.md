# V0.5 deploy

1. GitHub'a `guvencheck-v0.5` klasörünü yükleyin.
2. Vercel → Settings → Build and Deployment → Root Directory = `guvencheck-v0.5`.
3. Save → Redeploy.
4. Mevcut `OPENAI_API_KEY` yeterlidir. İsteğe bağlı olarak:
   - `OPENAI_FAST_MODEL=gpt-5.6-luna`
   - `OPENAI_DEEP_MODEL=gpt-5.6-terra`
5. `/api/health` içinde `version: 0.5.0` kontrol edin.
6. İlk doğrulama için önce `/lab` → Hibrit rota → 24 mesaj; ardından 6 ekran görüntüsü çalıştırın.
