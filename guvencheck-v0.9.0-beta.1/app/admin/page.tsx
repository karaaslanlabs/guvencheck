import Link from "next/link";
import { analyticsConfigured, readBetaEvents, type BetaEventRow } from "../../lib/supabase-rest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const reasonLabels: Record<string,string> = {
  dogru: "Doğru / faydalı",
  fazla_supheci: "Fazla şüpheciydi",
  riski_az_gosterdi: "Riski az gösterdi",
  anlasilmadi: "Açıklama anlaşılmadı",
  diger: "Diğer"
};
const typeLabels: Record<string,string> = { text: "Mesaj", link: "Link", image: "Ekran görüntüsü" };
const routeLabels: Record<string,string> = {
  "luna-fast-path": "Luna · hızlı yol",
  "luna-to-terra": "Luna → Terra",
  "terra-link-web": "Terra · web doğrulama"
};

function pct(n: number, d: number) { return d ? Math.round((n / d) * 100) : 0; }
function fmtDate(value?: string) {
  if (!value) return "—";
  try { return new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value)); }
  catch { return value; }
}

function countBy(rows: BetaEventRow[], key: (r: BetaEventRow) => string | null | undefined) {
  const out: Record<string,number> = {};
  for (const row of rows) { const k = key(row); if (k) out[k] = (out[k] || 0) + 1; }
  return out;
}

export default async function AdminPage() {
  let rows: BetaEventRow[] = [];
  let error = "";
  if (!analyticsConfigured()) error = "Supabase analytics henüz yapılandırılmadı.";
  else {
    try { rows = await readBetaEvents(5000); }
    catch (e) { error = e instanceof Error ? e.message : "Analytics okunamadı."; }
  }

  const completed = rows.filter(r => r.event_type === "analysis_completed");
  const errors = rows.filter(r => r.event_type === "analysis_error");
  const feedback = rows.filter(r => r.event_type === "analysis_feedback");
  const shares = rows.filter(r => r.event_type === "share_clicked");
  const sessions = new Set(rows.map(r => r.session_id).filter(Boolean));
  const analysisSessions = new Set(completed.map(r => r.session_id).filter(Boolean));
  const helpful = feedback.filter(r => r.helpful === true).length;
  const unhelpful = feedback.filter(r => r.helpful === false).length;
  const avgLatency = completed.length ? Math.round(completed.reduce((a,r) => a + (r.latency_ms || 0), 0) / completed.length) : 0;
  const byType = countBy(completed, r => r.analysis_type);
  const byLevel = countBy(completed, r => r.risk_level);
  const byRoute = countBy(completed, r => r.model_route);
  const byReason = countBy(feedback.filter(r => r.helpful === false), r => r.feedback_reason);
  // Page view satırları beta sırasında çok gürültülü. Son olay tablosunda yalnız anlamlı ürün hareketlerini göster.
  const recent = rows.filter(r => r.event_type !== "page_view").slice(0, 30);
  const attempts = completed.length + errors.length;

  return <main className="adminShell">
    <header className="adminHead">
      <div><div className="brand">GüvenCheck Admin</div><div className="tagline">Kapalı beta V0.8.3 · içerik saklamayan ürün analitiği</div></div>
      <Link href="/" className="labBack">Uygulamaya dön</Link>
    </header>

    {error ? <section className="adminAlert"><strong>Analytics bağlı değil</strong><span>{error}</span></section> : null}

    <section className="adminGrid">
      <div className="adminMetric"><span>Anonim oturum</span><strong>{sessions.size}</strong><small>Tarayıcı bazlı beta oturumu</small></div>
      <div className="adminMetric"><span>Analiz yapan oturum</span><strong>{analysisSessions.size}</strong><small>{sessions.size ? `%${pct(analysisSessions.size, sessions.size)} dönüşüm` : "Henüz veri yok"}</small></div>
      <div className="adminMetric"><span>Tamamlanan analiz</span><strong>{completed.length}</strong></div>
      <div className="adminMetric"><span>Faydalı geri bildirim</span><strong>{feedback.length ? `${pct(helpful, feedback.length)}%` : "—"}</strong><small>{helpful} evet · {unhelpful} hayır</small></div>
      <div className="adminMetric"><span>Geri bildirim oranı</span><strong>{completed.length ? `${pct(feedback.length, completed.length)}%` : "—"}</strong><small>{feedback.length}/{completed.length || 0} analiz</small></div>
      <div className="adminMetric"><span>Hata oranı</span><strong>{attempts ? `${pct(errors.length, attempts)}%` : "—"}</strong><small>{errors.length} hata</small></div>
      <div className="adminMetric"><span>Paylaşım oranı</span><strong>{completed.length ? `${pct(shares.length, completed.length)}%` : "—"}</strong><small>{shares.length} paylaşım tıklaması</small></div>
      <div className="adminMetric"><span>Ort. analiz süresi</span><strong>{avgLatency ? `${(avgLatency/1000).toFixed(1)} sn` : "—"}</strong></div>
      <div className="adminMetric"><span>Beta sağlık</span><strong>{errors.length === 0 && completed.length > 0 ? "İyi" : completed.length ? "İzle" : "—"}</strong><small>Kritik metrik: hata + geri bildirim</small></div>
    </section>

    <section className="adminPanels adminPanelsFour">
      <div className="adminPanel"><h2>Analiz türleri</h2>{Object.keys(byType).length ? Object.entries(byType).map(([k,v]) => <div className="adminBarRow" key={k}><span>{typeLabels[k] || k}</span><b>{v}</b><i style={{width:`${pct(v, completed.length)}%`}} /></div>) : <p>Henüz veri yok.</p>}</div>
      <div className="adminPanel"><h2>Risk dağılımı</h2>{Object.keys(byLevel).length ? Object.entries(byLevel).map(([k,v]) => <div className="adminBarRow" key={k}><span>{k === "high" ? "Yüksek" : k === "medium" ? "Orta" : "Düşük"}</span><b>{v}</b><i style={{width:`${pct(v, completed.length)}%`}} /></div>) : <p>Henüz veri yok.</p>}</div>
      <div className="adminPanel"><h2>Model rotaları</h2>{Object.keys(byRoute).length ? Object.entries(byRoute).map(([k,v]) => <div className="adminBarRow" key={k}><span>{routeLabels[k] || k}</span><b>{v}</b><i style={{width:`${pct(v, completed.length)}%`}} /></div>) : <p>Henüz veri yok.</p>}</div>
      <div className="adminPanel"><h2>Olumsuz geri bildirim</h2>{Object.keys(byReason).length ? Object.entries(byReason).map(([k,v]) => <div className="adminReason" key={k}><span>{reasonLabels[k] || k}</span><b>{v}</b></div>) : <p>Henüz olumsuz geri bildirim yok.</p>}</div>
    </section>

    <section className="adminPanel adminRecent">
      <h2>Son anlamlı ürün olayları</h2>
      {recent.length ? <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Zaman</th><th>Olay</th><th>Tür</th><th>Skor</th><th>Rota</th><th>Oturum</th></tr></thead><tbody>
        {recent.map((r,idx) => <tr key={`${r.id || idx}-${r.created_at}`}><td>{fmtDate(r.created_at)}</td><td>{r.event_type}</td><td>{r.analysis_type ? typeLabels[r.analysis_type] : "—"}</td><td>{typeof r.score === "number" ? r.score : "—"}</td><td>{r.model_route ? (routeLabels[r.model_route] || r.model_route) : "—"}</td><td>{r.session_id ? `${r.session_id.slice(0,8)}…` : "—"}</td></tr>)}
      </tbody></table></div> : <p>Henüz analiz, geri bildirim veya paylaşım olayı yok.</p>}
      <p className="adminPrivacy">Bu panel analiz edilen mesajı, linki veya ekran görüntüsünü göstermez; yalnızca anonim ürün metriklerini gösterir. Sayfa görüntülemeleri son olay tablosunda gürültüyü azaltmak için gizlenir.</p>
    </section>
  </main>;
}
