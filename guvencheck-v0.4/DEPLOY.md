# V0.4 deploy

1. `guvencheck-v0.4` klasörünü GitHub repo köküne yükle.
2. Vercel > Settings > Build and Deployment > Root Directory değerini `guvencheck-v0.4` yap.
3. Save ve Redeploy.
4. `/api/health` çıktısında `version: "0.4.0"` bekle.
5. Normal uygulamayı test et.
6. Benchmark için `/lab` adresine git. Testler otomatik başlamaz.
