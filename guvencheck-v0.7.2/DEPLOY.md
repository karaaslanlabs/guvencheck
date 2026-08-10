# V0.7 deploy

1. GitHub'a `guvencheck-v0.7` klasörünü yükle.
2. Vercel > Settings > Build and Deployment > Root Directory = `guvencheck-v0.7`.
3. Save > Redeploy.
4. `/api/health` sürümü `0.7.2` olmalı.
5. Kapalı beta için Vercel > Environment Variables altında `BETA_ACCESS_KEY` ekleyebilirsin. Bu değer tanımlanırsa uygulama tarayıcı kullanıcı adı/parola penceresiyle korunur; kullanıcı adı herhangi bir şey olabilir, parola bu değerdir.
6. Lab gerekiyorsa ayrıca `LAB_ACCESS_KEY` tanımla. Tanımlanmazsa `/lab` 404 kalır.
