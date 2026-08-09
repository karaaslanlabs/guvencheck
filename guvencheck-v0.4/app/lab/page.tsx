"use client";

import { useMemo, useState } from "react";

type RiskLevel = "low" | "medium" | "high";
type CaseType = "text" | "link";
type TestCase = { id: string; name: string; type: CaseType; content: string; expected: RiskLevel };
type Result = { id: string; actual?: RiskLevel; score?: number; pass?: boolean; latencyMs?: number; costUsd?: number; error?: string };

const textCases: TestCase[] = [
  { id:"t01", name:"OTP + acil ödeme", type:"text", expected:"high", content:"Hesabınız askıya alınacaktır. Hemen ödeme yapın ve SMS doğrulama kodunuzu paylaşın." },
  { id:"t02", name:"Savcı / güvenli hesap", type:"text", expected:"high", content:"Savcılıktan arıyoruz. Adınıza terör soruşturması var. Paranızın güvenliği için belirtilen IBAN'a hemen aktarın ve kimseye söylemeyin." },
  { id:"t03", name:"Kargo ücreti linki", type:"text", expected:"high", content:"Kargonuz teslim edilemedi. 17,50 TL yeniden teslimat ücretini bugün yatırmazsanız paketiniz iade edilecektir. Linkten kart bilgilerinizi girin." },
  { id:"t04", name:"Uzaktan erişim", type:"text", expected:"high", content:"Banka güvenlik biriminden arıyoruz. Hesabınızdaki şüpheli işlemi iptal etmek için AnyDesk kurun ve ekrandaki kodu bize söyleyin." },
  { id:"t05", name:"Yatırım garantisi", type:"text", expected:"high", content:"Devlet garantili yatırım fırsatı: 24 saatte yüzde 30 kesin kazanç. Kontenjan bitmeden USDT gönderin." },
  { id:"t06", name:"Kapora baskısı", type:"text", expected:"high", content:"Evi size ayırmam için görmeden 15.000 TL kapora gönderin. Başka müşteri bekliyor, 10 dakika içinde ödeme olmazsa ilanı veriyorum." },
  { id:"t07", name:"Sahte banka doğrulaması", type:"text", expected:"high", content:"Kartınız bloke edildi. Blokeyi kaldırmak için kart numarası, son kullanma tarihi ve telefonunuza gelen tek kullanımlık kodu yanıtlayın." },
  { id:"t08", name:"Ödül / ücret", type:"text", expected:"high", content:"Tebrikler iPhone kazandınız. Ödülü almak için 299 TL kargo ve sigorta ücretini havale edin." },
  { id:"t09", name:"Normal banka bilgilendirmesi", type:"text", expected:"low", content:"Kredi kartı ekstreniz oluşturulmuştur. Detayları mobil uygulamamızdan görüntüleyebilirsiniz. Bankamız sizden SMS ile şifre veya doğrulama kodu istemez." },
  { id:"t10", name:"Normal kargo bildirimi", type:"text", expected:"low", content:"Gönderiniz dağıtıma çıkarılmıştır. Teslimat durumunu kargo firmasının resmi mobil uygulamasından takip edebilirsiniz." },
  { id:"t11", name:"Arkadaş mesajı", type:"text", expected:"low", content:"Akşam 8 gibi kafede buluşalım mı? Uygunsan haber ver." },
  { id:"t12", name:"Fatura hatırlatma", type:"text", expected:"low", content:"Elektrik faturanızın son ödeme tarihi 18 Ağustos. Faturanızı kendi bankanızın uygulaması veya resmi müşteri portalından ödeyebilirsiniz." },
  { id:"t13", name:"İş görüşmesi", type:"text", expected:"low", content:"Merhaba, dün yaptığımız iş görüşmesine istinaden ikinci görüşmeyi salı günü saat 14.00 için planlamak istiyoruz. Uygun musunuz?" },
  { id:"t14", name:"E-ticaret sipariş özeti", type:"text", expected:"low", content:"Siparişiniz alındı. Sipariş numaranız 41287. Teslimat detaylarını satın alma yaptığınız mağazadaki hesabınızdan görebilirsiniz." },
  { id:"t15", name:"Belirsiz ödeme isteği", type:"text", expected:"medium", content:"Ödemeniz bekliyor. İşlemi tamamlamak için hesabınıza giriş yapmanız gerekiyor." },
  { id:"t16", name:"Belirsiz destek mesajı", type:"text", expected:"medium", content:"Hesabınızda olağandışı hareket tespit edildi. Destek ekibimizle iletişime geçmenizi öneririz." },
];

const linkCases: TestCase[] = [
  { id:"l01", name:"Apple resmi Türkiye", type:"link", expected:"low", content:"apple.com/tr/" },
  { id:"l02", name:"e-Devlet resmi", type:"link", expected:"low", content:"turkiye.gov.tr" },
  { id:"l03", name:"GİB resmi", type:"link", expected:"low", content:"gib.gov.tr" },
  { id:"l04", name:"Apple çağrışımlı test vakası", type:"link", expected:"high", content:"appleturkiye.com" },
];

const levelTr = { low:"Düşük", medium:"Orta", high:"Yüksek" } as const;

export default function LabPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [suite, setSuite] = useState<"text"|"link">("text");
  const cases = suite === "text" ? textCases : linkCases;

  async function runSuite() {
    if (running) return;
    setRunning(true);
    setResults({});
    for (const test of cases) {
      const started = performance.now();
      try {
        const response = await fetch("/api/analyze", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ type:test.type, content:test.content })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Analiz başarısız");
        const actual = data.level as RiskLevel;
        const pass = actual === test.expected;
        setResults(prev => ({...prev, [test.id]: {
          id:test.id, actual, score:data.score, pass,
          latencyMs:data?.meta?.latencyMs ?? Math.round(performance.now()-started),
          costUsd:data?.meta?.estimatedCostUsd
        }}));
      } catch (e) {
        setResults(prev => ({...prev, [test.id]: {id:test.id, pass:false, error:e instanceof Error ? e.message : "Hata"}}));
      }
      await new Promise(r => setTimeout(r, 250));
    }
    setRunning(false);
  }

  const stats = useMemo(() => {
    const rows = Object.values(results);
    const done = rows.length;
    const passed = rows.filter(r=>r.pass).length;
    const cost = rows.reduce((a,r)=>a+(r.costUsd || 0),0);
    const latency = rows.filter(r=>r.latencyMs).reduce((a,r)=>a+(r.latencyMs || 0),0);
    return { done, passed, rate: done ? Math.round((passed/done)*100) : 0, cost, avgLatency: done ? Math.round(latency/done) : 0 };
  }, [results]);

  return <main className="labShell">
    <header className="brandRow"><div className="logo">G</div><div><div className="brand">GüvenCheck Lab</div><div className="tagline">V0.4 — kalite ve maliyet ölçümü</div></div><a className="labBack" href="/">Uygulamaya dön</a></header>
    <section className="card labIntro">
      <h1>Benchmark</h1>
      <p className="lead">Bu sayfa üretim ürünü değildir. Test setini yalnızca sen başlattığında API çağrısı yapar ve bakiye harcar.</p>
      <div className="labTabs">
        <button className={suite==="text"?"active":""} onClick={()=>{if(!running){setSuite("text");setResults({});}}}>16 mesaj testi</button>
        <button className={suite==="link"?"active":""} onClick={()=>{if(!running){setSuite("link");setResults({});}}}>4 link testi</button>
      </div>
      <button className="primary" disabled={running} onClick={runSuite}>{running ? "Testler çalışıyor…" : `${cases.length} testi başlat`}</button>
      {stats.done>0 && <div className="labStats">
        <div><strong>{stats.rate}%</strong><span>Beklentiyle eşleşme</span></div>
        <div><strong>${stats.cost.toFixed(4)}</strong><span>Tahmini API maliyeti</span></div>
        <div><strong>{stats.avgLatency} ms</strong><span>Ort. gecikme</span></div>
      </div>}
    </section>
    <section className="labList">
      {cases.map(test => {
        const r=results[test.id];
        return <article className="card labCase" key={test.id}>
          <div className="labCaseTop"><div><strong>{test.id.toUpperCase()} · {test.name}</strong><div className="labExpected">Beklenen: {levelTr[test.expected]}</div></div>
            <span className={`labStatus ${!r?"idle":r.pass?"pass":"fail"}`}>{!r?"Bekliyor":r.error?"Hata":r.pass?"Geçti":"İncele"}</span>
          </div>
          <p>{test.content}</p>
          {r && !r.error && <div className="labResult">Sonuç: <b>{r.score}/100 · {r.actual && levelTr[r.actual]}</b>{typeof r.costUsd === "number" ? ` · $${r.costUsd.toFixed(4)}`:""}{r.latencyMs ? ` · ${r.latencyMs} ms`:""}</div>}
          {r?.error && <div className="error">{r.error}</div>}
        </article>
      })}
    </section>
  </main>
}
