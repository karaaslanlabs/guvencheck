# GüvenCheck V0.8.2 — Supabase Analytics Kurulumu

1. Supabase projesinde **SQL Editor** açın.
2. `supabase-schema.sql` dosyasının tamamını yapıştırın ve **Run** edin.
3. Supabase **Settings → API Keys** bölümünde server-side **Secret key** değerini bulun.
4. Vercel → GüvenCheck → **Settings → Environment Variables** bölümüne ekleyin:
   - `SUPABASE_URL` = Supabase proje URL'si
   - `SUPABASE_SECRET_KEY` = `sb_secret_...` ile başlayan secret key
   - `ADMIN_ACCESS_KEY` = yalnızca sizin bildiğiniz güçlü admin parolası
5. Vercel'de Redeploy yapın.
6. `/api/health` çıktısında `analyticsConfigured: true` görünmeli.
7. Bir analiz + geri bildirim yaptıktan sonra `/admin` adresine gidin. Tarayıcı parola ekranında kullanıcı adına herhangi bir şey, parola olarak `ADMIN_ACCESS_KEY` girin.

Güvenlik: `SUPABASE_SECRET_KEY` hiçbir zaman GitHub'a, tarayıcı koduna veya sohbete yapıştırılmamalıdır.
