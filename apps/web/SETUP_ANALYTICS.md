# GüvenCheck V0.8.3 — Supabase Analytics Kurulumu

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

## Mevcut beta kurulumunu decision-support feedback için güncelleme

Mevcut `beta_events` tablosu zaten varsa `supabase-decision-feedback-migration.sql` dosyasını Supabase SQL Editor'da bir kez çalıştırın. Bu işlem mevcut veriyi silmez; yalnızca izin verilen geri bildirim nedenlerini genişletir.
## M3.2 production evidence activation

Mevcut production beta veritabanı için tam schema'yı tekrar çalıştırmak yerine `supabase-m3-2-evidence-migration.sql` kullanılır. Bu migration production'a yalnız ayrı Founder migration gate'inden sonra uygulanır.

Mevcut `m3_2_evidence_activation` production'a uygulanmışsa, bounded Protection evidence olayları (`protection_candidate_eligible` + `protection_action_due_view`) için `supabase-m3-2-protection-evidence-migration.sql` ayrıca Founder migration gate'inden geçirilir.

Vercel production environment'a ayrıca güçlü ve rastgele bir `ANALYSIS_REUSE_SECRET` eklenir (en az 16 karakter; repo/sohbet/client koduna yazılmaz). Deploy sonrası `/api/health` içinde `reuseConfigured: true` doğrulanır.

Reuse smoke testinde aynı cache-uygun link ikinci kez analiz edildiğinde `link-reuse` zero-cost route ve `analysis_reuse_hit` evidence görülmelidir. Curated registry boşken curated hit beklenmez.
