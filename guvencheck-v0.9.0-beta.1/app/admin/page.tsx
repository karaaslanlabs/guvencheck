import Link from "next/link";
import { analyticsConfigured, readBetaEvents, type BetaEventRow } from "../../lib/supabase-rest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Beta Validation 1 gerçek başlangıcı.
// Teknik denemeleri gerçek beta kohortuna karıştırmıyoruz.
const BETA_START_ISO = "2026-08-11T00:00:00+03:00";
const BETA_USER_GOAL = 100;

const reasonLabels: Record<string,string> = {
  dogru: "Doğru / faydalı",
  fazla_supheci: "Fazla şüpheciydi",
  riski_az_gosterdi: "Riski az gösterdi",
  anlasilmadi: "Açıklama anlaşılmadı",
  diger: "Diğer"
};

const typeLabels: Record<string,string> = {
  text: "Mesaj",
  link: "Link",
  image: "Ekran görüntüsü"
};

const routeLabels: Record<string,string> = {
  "luna-fast-path": "Luna · hızlı yol",
  "luna-to-terra": "Luna → Terra",
  "terra-link-web": "Terra · web doğrulama",
  "hybrid-escalated": "Hybrid · escalated",
  "luna-fast": "Luna · hızlı yol",
  "terra-web": "Terra · web"
};

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0;
}

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

// Mobil yeni format:
// mobile:gc-xxxxxxxxxxxxxxxx:s:xxxxxxxx
//
// Web'de localStorage UUID'si kullanıcı kimliği gibi davranır.
// Böylece Supabase şemasına yeni kolon eklemeden beta kullanıcı kohortu ölçülür.
function identityFromSession(sessionId?: string | null) {
  if (!sessionId) return null;

  const mobile = sessionId.match(/^mobile:(gc-[^:]+):s:/);
  if (mobile) return `mobile:${mobile[1]}`;

  return `web:${sessionId}`;
}

function distinct<T>(values: T[]) {
  return new Set(values);
}

export default async function AdminPage() {
  let rows: BetaEventRow[] = [];
  let error = "";

  if (!analyticsConfigured()) {
    error = "Supabase analytics henüz yapılandırılmadı.";
  } else {
    try {
      rows = await readBetaEvents(10000);
    } catch (e) {
      error = e instanceof Error ? e.message : "Analytics okunamadı.";
    }
  }

  const betaStart = new Date(BETA_START_ISO).getTime();
  const betaRows = rows.filter((r) => {
    if (!r.created_at) return false;
    const t = new Date(r.created_at).getTime();
    return Number.isFinite(t) && t >= betaStart;
  });

  const pageViews = betaRows.filter(r => r.event_type === "page_view");
  const started = betaRows.filter(r => r.event_type === "analysis_started");
  const completed = betaRows.filter(r => r.event_type === "analysis_completed");
  const errors = betaRows.filter(r => r.event_type === "analysis_error");
  const feedback = betaRows.filter(r => r.event_type === "analysis_feedback");
  const shares = betaRows.filter(r => r.event_type === "share_clicked");

  const seenIdentities = distinct(
    betaRows.map(r => identityFromSession(r.session_id)).filter((v): v is string => Boolean(v))
  );
  const activatedIdentities = distinct(
    completed.map(r => identityFromSession(r.session_id)).filter((v): v is string => Boolean(v))
  );

  // Repeat: aynı anonim install/user identity'si altında 2+ farklı session id içinde
  // tamamlanan analiz bulunması. Bu özellikle mobile installId formatında güvenilir.
  const completedSessionsByIdentity = new Map<string, Set<string>>();
  for (const row of completed) {
    const identity = identityFromSession(row.session_id);
    if (!identity || !row.session_id) continue;
    if (!completedSessionsByIdentity.has(identity)) {
      completedSessionsByIdentity.set(identity, new Set());
    }
    completedSessionsByIdentity.get(identity)!.add(row.session_id);
  }

  let repeatUsers = 0;
  for (const sessions of completedSessionsByIdentity.values()) {
    if (sessions.size >= 2) repeatUsers += 1;
  }

  const helpful = feedback.filter(r => r.helpful === true).length;
  const unhelpful = feedback.filter(r => r.helpful === false).length;
  const attempts = completed.length + errors.length;
  const avgLatency = completed.length
    ? Math.round(completed.reduce((a,r) => a + (r.latency_ms || 0), 0) / completed.length)
    : 0;

  const byType = countBy(completed, r => r.analysis_type);
  const byLevel = countBy(completed, r => r.risk_level);
  const byRoute = countBy(completed, r => r.model_route);
  const byReason = countBy(feedback.filter(r => r.helpful === false), r => r.feedback_reason);

  const recent = betaRows
    .filter(r => r.event_type !== "page_view")
    .slice(0, 40);

  const users = seenIdentities.size;
  const activatedUsers = activatedIdentities.size;
  const activationRate = pct(activatedUsers, users);
  const completionRate = pct(completed.length, started.length);
  const helpfulRate = pct(helpful, feedback.length);
  const errorRate = pct(errors.length, attempts);
  const repeatRate = pct(repeatUsers, activatedUsers);
  const shareStartRate = pct(shares.length, completed.length);

  return (
    <main className="adminShell">
      <header className="adminHead">
        <div>
          <div className="brand">GüvenCheck Admin</div>
          <div className="tagline">
            Beta Validation 1 · başlangıç 11.08.2026 00:00 · içerik saklamayan ürün analitiği
          </div>
        </div>
        <Link href="/" className="labBack">Uygulamaya dön</Link>
      </header>

      {error ? (
        <section className="adminAlert">
          <strong>Analytics bağlı değil</strong>
          <span>{error}</span>
        </section>
      ) : null}

      <section className="adminGrid">
        <div className="adminMetric">
          <span>Gerçek beta kullanıcıları</span>
          <strong>{users} / {BETA_USER_GOAL}</strong>
          <small>Anonim install/browser kimliği</small>
        </div>

        <div className="adminMetric">
          <span>Aktivasyon</span>
          <strong>{users ? `${activationRate}%` : "—"}</strong>
          <small>{activatedUsers}/{users || 0} kullanıcı analiz tamamladı</small>
        </div>

        <div className="adminMetric">
          <span>Tamamlanan analiz</span>
          <strong>{completed.length}</strong>
          <small>{started.length} analiz başlatıldı</small>
        </div>

        <div className="adminMetric">
          <span>Analiz tamamlama</span>
          <strong>{started.length ? `${completionRate}%` : "—"}</strong>
          <small>{completed.length}/{started.length || 0}</small>
        </div>

        <div className="adminMetric">
          <span>Faydalı geri bildirim</span>
          <strong>{feedback.length ? `${helpfulRate}%` : "—"}</strong>
          <small>{helpful} evet · {unhelpful} hayır</small>
        </div>

        <div className="adminMetric">
          <span>Hata oranı</span>
          <strong>{attempts ? `${errorRate}%` : "—"}</strong>
          <small>{errors.length} hata</small>
        </div>

        <div className="adminMetric">
          <span>Tekrar kullanan</span>
          <strong>{activatedUsers ? `${repeatRate}%` : "—"}</strong>
          <small>{repeatUsers} kullanıcı · 2+ ayrı session</small>
        </div>

        <div className="adminMetric">
          <span>Paylaşım başlatma oranı</span>
          <strong>{completed.length ? `${shareStartRate}%` : "—"}</strong>
          <small>{shares.length} paylaşım akışı açıldı</small>
        </div>

        <div className="adminMetric">
          <span>Ort. analiz süresi</span>
          <strong>{avgLatency ? `${(avgLatency / 1000).toFixed(1)} sn` : "—"}</strong>
          <small>Tamamlanan analizler</small>
        </div>
      </section>

      <section className="adminPanels adminPanelsFour">
        <div className="adminPanel">
          <h2>Analiz türleri</h2>
          {Object.keys(byType).length
            ? Object.entries(byType).map(([k,v]) => (
                <div className="adminBarRow" key={k}>
                  <span>{typeLabels[k] || k}</span>
                  <b>{v}</b>
                  <i style={{width:`${pct(v, completed.length)}%`}} />
                </div>
              ))
            : <p>Henüz veri yok.</p>}
        </div>

        <div className="adminPanel">
          <h2>Risk dağılımı</h2>
          {Object.keys(byLevel).length
            ? Object.entries(byLevel).map(([k,v]) => (
                <div className="adminBarRow" key={k}>
                  <span>{k === "high" ? "Yüksek" : k === "medium" ? "Orta" : "Düşük"}</span>
                  <b>{v}</b>
                  <i style={{width:`${pct(v, completed.length)}%`}} />
                </div>
              ))
            : <p>Henüz veri yok.</p>}
        </div>

        <div className="adminPanel">
          <h2>Model rotaları</h2>
          {Object.keys(byRoute).length
            ? Object.entries(byRoute).map(([k,v]) => (
                <div className="adminBarRow" key={k}>
                  <span>{routeLabels[k] || k}</span>
                  <b>{v}</b>
                  <i style={{width:`${pct(v, completed.length)}%`}} />
                </div>
              ))
            : <p>Henüz veri yok.</p>}
        </div>

        <div className="adminPanel">
          <h2>Olumsuz geri bildirim</h2>
          {Object.keys(byReason).length
            ? Object.entries(byReason).map(([k,v]) => (
                <div className="adminReason" key={k}>
                  <span>{reasonLabels[k] || k}</span>
                  <b>{v}</b>
                </div>
              ))
            : <p>Henüz olumsuz geri bildirim yok.</p>}
        </div>
      </section>

      <section className="adminPanel adminRecent">
        <h2>Son anlamlı ürün olayları</h2>

        {recent.length ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Olay</th>
                  <th>Tür</th>
                  <th>Skor</th>
                  <th>Rota</th>
                  <th>Oturum</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r,idx) => (
                  <tr key={`${r.id || idx}-${r.created_at}`}>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>{r.event_type}</td>
                    <td>{r.analysis_type ? typeLabels[r.analysis_type] : "—"}</td>
                    <td>{typeof r.score === "number" ? r.score : "—"}</td>
                    <td>{r.model_route ? (routeLabels[r.model_route] || r.model_route) : "—"}</td>
                    <td>{r.session_id ? `${r.session_id.slice(0,18)}…` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Beta Validation 1 başlangıcından sonra henüz anlamlı ürün olayı yok.</p>
        )}

        <p className="adminPrivacy">
          Bu panel analiz edilen mesajı, linki veya ekran görüntüsünü göstermez;
          yalnızca anonim ürün metriklerini gösterir. “Paylaşım başlatma” sistem
          paylaşım akışının açıldığını ifade eder; gerçek gönderimi garanti etmez.
        </p>
      </section>
    </main>
  );
}
