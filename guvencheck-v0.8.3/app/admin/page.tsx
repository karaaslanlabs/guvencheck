import Link from "next/link";
import { analyticsConfigured, readBetaEvents, type BetaEventRow } from "../../lib/supabase-rest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Beta Validation 1 resmi başlangıcı.
// İlk gerçek kullanıcıyı bu tarihten sonra teste al.
const BETA_START_ISO = "2026-08-10T22:35:00+03:00";
const BETA_TARGET_USERS = 100;

const reasonLabels: Record<string,string> = {
  dogru: "Doğru / faydalı",
  fazla_supheci: "Fazla şüpheciydi",
  riski_az_gosterdi: "Riski az gösterdi",
  anlasilmadi: "Açıklama anlaşılmadı",
  diger: "Diğer",
  belirtilmedi: "Neden seçilmedi"
};

const typeLabels: Record<string,string> = { text: "Mesaj", link: "Link", image: "Ekran görüntüsü" };
const routeLabels: Record<string,string> = {
  "luna-fast-path": "Luna · hızlı yol",
  "luna-to-terra": "Luna → Terra",
  "terra-link-web": "Terra · web doğrulama",
  "hybrid-escalated": "hybrid-escalated",
  "terra-web": "terra-web"
};

function pct(n: number, d: number) { return d ? Math.round((n / d) * 100) : 0; }

function fmtDate(value?: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Istanbul"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function countBy(rows: BetaEventRow[], key: (r: BetaEventRow) => string | null | undefined) {
  const out: Record<string,number> = {};
  for (const row of rows) {
    const k = key(row);
    if (k) out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function installIdFromSession(sessionId?: string | null) {
  if (!sessionId) return null;
  const match = /^mobile:(gc-[a-z0-9]{16,32}):s:/.exec(sessionId);
  return match?.[1] || null;
}

export default async function AdminPage() {
  let allRows: BetaEventRow[] = [];
  let error = "";

  if (!analyticsConfigured()) {
    error = "Supabase analytics henüz yapılandırılmadı.";
  } else {
    try {
      allRows = await readBetaEvents(5000);
    } catch (e) {
      error = e instanceof Error ? e.message : "Analytics okunamadı.";
    }
  }

  const betaStartMs = new Date(BETA_START_ISO).getTime();
  const rows = allRows.filter(r => {
    const created = r.created_at ? new Date(r.created_at).getTime() : NaN;
    return Number.isFinite(created) && created >= betaStartMs;
  });

  const started = rows.filter(r => r.event_type === "analysis_started");
  const completed = rows.filter(r => r.event_type === "analysis_completed");
  const errors = rows.filter(r => r.event_type === "analysis_error");
  const feedback = rows.filter(r => r.event_type === "analysis_feedback");
  const shares = rows.filter(r => r.event_type === "share_clicked");

  // installId yalnızca session_id içindeki anonim, rastgele uygulama kurulum kimliğidir.
  const betaUsers = new Set(
    rows.map(r => installIdFromSession(r.session_id)).filter((v): v is string => Boolean(v))
  );

  const activatedUsers = new Set(
    completed.map(r => installIdFromSession(r.session_id)).filter((v): v is string => Boolean(v))
  );

  const completedSessionsByInstall = new Map<string, Set<string>>();
  for (const row of completed) {
    const installId = installIdFromSession(row.session_id);
    if (!installId || !row.session_id) continue;
    const set = completedSessionsByInstall.get(installId) || new Set<string>();
    set.add(row.session_id);
    completedSessionsByInstall.set(installId, set);
  }

  const repeatUsers = [...completedSessionsByInstall.values()].filter(sessions => sessions.size >= 2).length;

  const helpful = feedback.filter(r => r.helpful === true).length;
  const unhelpful = feedback.filter(r => r.helpful === false).length;
  const avgLatency = completed.length
    ? Math.round(completed.reduce((a,r) => a + (r.latency_ms || 0), 0) / completed.length)
    : 0;

  const byType = countBy(completed, r => r.analysis_type);
  const byLevel = countBy(completed, r => r.risk_level);
  const byRoute = countBy(completed, r => r.model_route);
  const byReason = countBy(
    feedback.filter(r => r.helpful === false),
    r => r.feedback_reason || "belirtilmedi"
  );

  const recent = rows.filter(r => r.event_type !== "page_view").slice(0, 30);
  const attempts = completed.length + errors.length;
  const completionRate = started.length ? pct(completed.length, started.length) : 0;
  const activationRate = betaUsers.size ? pct(activatedUsers.size, betaUsers.size) : 0;
  const repeatRate = activatedUsers.size ? pct(repeatUsers, activatedUsers.size) : 0;
  const shareStartRate = completed.length ? pct(shares.length, completed.length) : 0;

  return <main className="adminShell">
    <header className="adminHead">
      <div>
        <div className="brand">GüvenCheck Admin</div>
        <div className="tagline">
          Beta Validation 1 · başlangıç {fmtDate(BETA_START_ISO)} · içerik saklamayan ürün analitiği
        </div>
      </div>
      <Link href="/" className="labBack">Uygulamaya dön</Link>
    </header>

    {error ? <section className="adminAlert">
      <strong>Analytics bağlı değil</strong><span>{error}</span>
    </section> : null}

    <section className="adminGrid">
      <div className="adminMetric">
        <span>Gerçek beta kullanıcıları</span>
        <strong>{betaUsers.size} / {BETA_TARGET_USERS}</strong>
        <small>Anonim uygulama kurulumu</small>
      </div>

      <div className="adminMetric">
        <span>Aktivasyon</span>
        <strong>{betaUsers.size ? `${activationRate}%` : "—"}</strong>
        <small>{activatedUsers.size}/{betaUsers.size || 0} kullanıcı en az 1 analiz tamamladı</small>
      </div>

      <div className="adminMetric">
        <span>Tamamlanan analiz</span>
        <strong>{completed.length}</strong>
        <small>{started.length} analiz başlatıldı</small>
      </div>

      <div className="adminMetric">
        <span>Analiz tamamlama</span>
        <strong>{started.length ? `${completionRate}%` : "—"}</strong>
        <small>{completed.length}/{started.length || 0} başlatılan analiz</small>
      </div>

      <div className="adminMetric">
        <span>Faydalı geri bildirim</span>
        <strong>{feedback.length ? `${pct(helpful, feedback.length)}%` : "—"}</strong>
        <small>{helpful} evet · {unhelpful} hayır</small>
      </div>

      <div className="adminMetric">
        <span>Hata oranı</span>
        <strong>{attempts ? `${pct(errors.length, attempts)}%` : "—"}</strong>
        <small>{errors.length} hata</small>
      </div>

      <div className="adminMetric">
        <span>Tekrar kullanan</span>
        <strong>{activatedUsers.size ? `${repeatRate}%` : "—"}</strong>
        <small>{repeatUsers} kullanıcı ≥2 ayrı oturumda analiz yaptı</small>
      </div>

      <div className="adminMetric">
        <span>Paylaşım başlatma oranı</span>
        <strong>{completed.length ? `${shareStartRate}%` : "—"}</strong>
        <small>{shares.length} paylaşım açılışı</small>
      </div>

      <div className="adminMetric">
        <span>Ort. analiz süresi</span>
        <strong>{avgLatency ? `${(avgLatency/1000).toFixed(1)} sn` : "—"}</strong>
        <small>Beta Validation 1 cohort'u</small>
      </div>
    </section>

    <section className="adminPanels adminPanelsFour">
      <div className="adminPanel"><h2>Analiz türleri</h2>
        {Object.keys(byType).length
          ? Object.entries(byType).map(([k,v]) =>
              <div className="adminBarRow" key={k}>
                <span>{typeLabels[k] || k}</span><b>{v}</b>
                <i style={{width:`${pct(v, completed.length)}%`}} />
              </div>)
          : <p>Henüz veri yok.</p>}
      </div>

      <div className="adminPanel"><h2>Risk dağılımı</h2>
        {Object.keys(byLevel).length
          ? Object.entries(byLevel).map(([k,v]) =>
              <div className="adminBarRow" key={k}>
                <span>{k === "high" ? "Yüksek" : k === "medium" ? "Orta" : "Düşük"}</span>
                <b>{v}</b><i style={{width:`${pct(v, completed.length)}%`}} />
              </div>)
          : <p>Henüz veri yok.</p>}
      </div>

      <div className="adminPanel"><h2>Model rotaları</h2>
        {Object.keys(byRoute).length
          ? Object.entries(byRoute).map(([k,v]) =>
              <div className="adminBarRow" key={k}>
                <span>{routeLabels[k] || k}</span><b>{v}</b>
                <i style={{width:`${pct(v, completed.length)}%`}} />
              </div>)
          : <p>Henüz veri yok.</p>}
      </div>

      <div className="adminPanel"><h2>Olumsuz geri bildirim</h2>
        {Object.keys(byReason).length
          ? Object.entries(byReason).map(([k,v]) =>
              <div className="adminReason" key={k}>
                <span>{reasonLabels[k] || k}</span><b>{v}</b>
              </div>)
          : <p>Henüz olumsuz geri bildirim yok.</p>}
      </div>
    </section>

    <section className="adminPanel adminRecent">
      <h2>Son anlamlı ürün olayları</h2>
      {recent.length
        ? <div className="adminTableWrap"><table className="adminTable">
            <thead><tr>
              <th>Zaman</th><th>Olay</th><th>Tür</th><th>Skor</th><th>Rota</th><th>Oturum</th>
            </tr></thead>
            <tbody>
              {recent.map((r,idx) => <tr key={`${r.id || idx}-${r.created_at}`}>
                <td>{fmtDate(r.created_at)}</td>
                <td>{r.event_type}</td>
                <td>{r.analysis_type ? typeLabels[r.analysis_type] : "—"}</td>
                <td>{typeof r.score === "number" ? r.score : "—"}</td>
                <td>{r.model_route ? (routeLabels[r.model_route] || r.model_route) : "—"}</td>
                <td>{r.session_id ? `${r.session_id.slice(0,18)}…` : "—"}</td>
              </tr>)}
            </tbody>
          </table></div>
        : <p>Beta Validation 1 başlangıcından sonra henüz anlamlı ürün olayı yok.</p>}

      <p className="adminPrivacy">
        Bu panel analiz edilen mesajı, linki veya ekran görüntüsünü göstermez.
        installId rastgele oluşturulan anonim bir uygulama kurulum kimliğidir;
        isim, telefon veya e-posta içermez.
      </p>
    </section>
  </main>;
}
