# GüvenCheck — Production Evidence Activation Runbook

Bu dosya M3.2 için deploy hazırlığını tarif eder. Production deploy/migration ayrı Founder gate'idir.

1. GitHub source of truth: `karaaslanlabs/guvencheck`; feature branch doğrulanmadan `main`e doğrudan push yok.
2. Vercel projesinin mevcut Root Directory ayarını değiştirirken geçmiş `guvencheck-v0.7` notunu kullanma; mevcut proje ayarını önce doğrula.
3. Production environment'ta gerekli anahtarların varlığını doğrula: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_ACCESS_KEY`, `AI_ANALYSIS_ENABLED`, bounded `AI_DAILY_ESTIMATED_COST_LIMIT_USD`, en az 16 karakterlik `ANALYSIS_REUSE_SECRET`.
4. Supabase production schema değişiklikleri yalnız ayrı migration gate'inde uygulanır; önce yedek/current schema doğrulanır.
5. Deploy sonrası `/api/health` için `ok=true`, `aiConfigured=true`, `analyticsConfigured=true`, `reuseConfigured=true` beklenir.
6. Production smoke: text/image/link analizleri, link fast/escalated route, economic event persistence ve admin metrics doğrulanır.
7. Reuse smoke: aynı uygun link ikinci kez verildiğinde `link-reuse` route + zero current AI/web cost ve `analysis_reuse_hit` evidence doğrulanır.
8. Curated registry boşsa `curated-intelligence` hit beklenmez; sahte kayıt eklenmez.
9. Payment, Play release, broad Growth ve provider migration bu runbook ile açılmaz.
