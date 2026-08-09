"use client";

import { useMemo, useState } from "react";

type RiskLevel = "low" | "medium" | "high";
type CaseType = "text" | "link" | "image";
type Suite = "text" | "link" | "image";
type BenchModel = "gpt-5.6-terra" | "gpt-5.6-luna" | "hybrid";
type TestCase = { id: string; name: string; type: CaseType; content: string; expected: RiskLevel; sender?: string; style?: "sms" | "bank" | "cargo" | "chat" };
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
  { id:"t17", name:"Bozuk Türkçeli OTP avı", type:"text", expected:"high", content:"Sn musteri kartiniz guvenlik sebebi ile kisitlandi. Iptal icin size gelen 6 haneli kodu temsilcimize soyleyiniz. Islem 5 dk icinde kapanacaktir." },
  { id:"t18", name:"İş ilanı ekipman ücreti", type:"text", expected:"high", content:"Uzaktan işe kabul edildiniz. Bilgisayar ve eğitim seti için önce 1.850 TL kayıt bedeli gönderin, ilk maaşta iade edeceğiz." },
  { id:"t19", name:"Tanıdıktan olağan para isteği", type:"text", expected:"medium", content:"Müsaitsen bana 700 TL atabilir misin? Akşam geri yollarım. Aynı IBAN'ım duruyor." },
  { id:"t20", name:"Randevu doğrulaması", type:"text", expected:"low", content:"Sayın danışanımız, 12 Ağustos saat 10.30 tarihli randevunuz onaylanmıştır. Değişiklik için kliniğimizi bilinen telefon numaramızdan arayabilirsiniz." },
  { id:"t21", name:"Kart işlemi uygulamadan kontrol", type:"text", expected:"low", content:"Kartınızla 1.249,90 TL tutarında işlem yapılmıştır. İşlem size ait değilse mobil uygulamamızdaki Kartlar > İşlemler bölümünden inceleyiniz. Bu mesaja yanıt vermeyiniz." },
  { id:"t22", name:"Kripto kurtarma dolandırıcılığı", type:"text", expected:"high", content:"Geçmiş yatırım kaybınızı devlet veri tabanından tespit ettik. Paranızı geri almak için yüzde 5 vergi bedelini BTC olarak yatırmanız yeterli." },
  { id:"t23", name:"Düşük baskılı sahte destek", type:"text", expected:"medium", content:"Hesabınız için destek kaydı oluşturuldu. İşlemi doğrulamak isterseniz müşteri temsilcimizle görüşebilirsiniz." },
  { id:"t24", name:"Okul bilgilendirmesi", type:"text", expected:"low", content:"Velilerimizin dikkatine: Veli toplantımız cuma günü saat 17.30'da okul konferans salonunda yapılacaktır. Katılımınızı bekleriz." },
];

const linkCases: TestCase[] = [
  { id:"l01", name:"Apple resmi Türkiye", type:"link", expected:"low", content:"apple.com/tr/" },
  { id:"l02", name:"e-Devlet resmi", type:"link", expected:"low", content:"turkiye.gov.tr" },
  { id:"l03", name:"GİB resmi", type:"link", expected:"low", content:"gib.gov.tr" },
  { id:"l04", name:"Apple çağrışımlı test vakası", type:"link", expected:"high", content:"appleturkiye.com" },
];

const imageCases: TestCase[] = [
  { id:"i01", name:"SMS — hesap kapanma + OTP", type:"image", expected:"high", sender:"Banka Güvenlik", style:"bank", content:"Hesabınız 30 dakika içinde askıya alınacaktır. İşlemi durdurmak için 4.950 TL güvenlik ödemesini yapın ve telefonunuza gelen doğrulama kodunu temsilcimize iletin." },
  { id:"i02", name:"Kargo — küçük ücret", type:"image", expected:"high", sender:"Hızlı Kargo", style:"cargo", content:"Paketiniz adres bilgisi nedeniyle teslim edilemedi. Bugün 23:59'a kadar 18,75 TL yeniden teslimat bedelini ödeyin. Kart bilgilerinizi bağlantıdan girin." },
  { id:"i03", name:"Normal banka bildirimi", type:"image", expected:"low", sender:"Banka", style:"bank", content:"Kredi kartı ekstreniz hazırdır. Ekstre detaylarını yalnızca mobil uygulamamızdan görüntüleyebilirsiniz. Bankamız mesajla şifre veya doğrulama kodu istemez." },
  { id:"i04", name:"Arkadaş sohbeti", type:"image", expected:"low", sender:"Ece", style:"chat", content:"Yarın 19.00'da sahilde buluşalım mı? Ben çıkınca sana yazarım 🙂" },
  { id:"i05", name:"Uzaktan erişim desteği", type:"image", expected:"high", sender:"Teknik Destek", style:"sms", content:"Cihazınızda zararlı yazılım tespit edildi. Hesabınızı korumak için AnyDesk'i yükleyin ve ekranda görünen 9 haneli erişim kodunu bize gönderin." },
  { id:"i06", name:"Belirsiz güvenlik uyarısı", type:"image", expected:"medium", sender:"Hesap Bildirimi", style:"sms", content:"Hesabınızda olağandışı hareket algılandı. Güvenlik ayarlarınızı gözden geçirmeniz önerilir." },
];

const levelTr = { low:"Düşük", medium:"Orta", high:"Yüksek" } as const;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/); const lines:string[]=[]; let line="";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line=word; }
    else line=test;
  }
  if (line) lines.push(line); return lines;
}

function makeScreenshotDataUrl(test: TestCase) {
  const canvas = document.createElement("canvas"); canvas.width=900; canvas.height=1450;
  const ctx=canvas.getContext("2d"); if(!ctx) throw new Error("Canvas açılamadı");
  ctx.fillStyle="#f3f4f6"; ctx.fillRect(0,0,900,1450);
  ctx.fillStyle="#111827"; ctx.font="600 28px Arial"; ctx.fillText("09:41",50,60);
  ctx.font="26px Arial"; ctx.fillText("●●●  Wi‑Fi   86%",630,60);
  ctx.fillStyle="#ffffff"; ctx.fillRect(0,90,900,120);
  ctx.fillStyle="#111827"; ctx.font="700 34px Arial"; ctx.fillText(test.sender || "Mesaj",60,160);
  ctx.fillStyle="#6b7280"; ctx.font="24px Arial"; ctx.fillText("Bugün 09:38",650,158);
  const x=test.style==="chat"?220:65, y=270, w=test.style==="chat"?610:770;
  ctx.fillStyle=test.style==="chat"?"#d1fae5":"#ffffff";
  ctx.strokeStyle="#d1d5db"; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(x,y,w,430,28); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#111827"; ctx.font="30px Arial";
  const lines=wrapText(ctx,test.content,w-70); lines.slice(0,10).forEach((line,i)=>ctx.fillText(line,x+35,y+65+i*48));
  ctx.fillStyle="#6b7280"; ctx.font="22px Arial"; ctx.fillText("SMS / Mesajlar",65,760);
  ctx.fillStyle="#ffffff"; ctx.strokeStyle="#e5e7eb"; ctx.beginPath(); ctx.roundRect(55,810,790,90,36); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#9ca3af"; ctx.font="26px Arial"; ctx.fillText("Mesaj",90,865);
  ctx.fillStyle="#111827"; ctx.font="22px Arial"; ctx.fillText("Bu görsel GüvenCheck benchmarkı için sentetik olarak üretildi.",75,1370);
  return canvas.toDataURL("image/png",0.9);
}

export default function LabPage() {
  const [running,setRunning]=useState(false); const [results,setResults]=useState<Record<string,Result>>({}); const [suite,setSuite]=useState<Suite>("text"); const [benchModel,setBenchModel]=useState<BenchModel>("gpt-5.6-luna");
  const cases=suite==="text"?textCases:suite==="link"?linkCases:imageCases;

  async function runSuite(){
    if(running)return; setRunning(true); setResults({});
    for(const test of cases){ const started=performance.now();
      try{
        const basePayload = test.type === "image" ? { type:"image", imageData:makeScreenshotDataUrl(test) } : { type:test.type, content:test.content };
        const payload = benchModel === "hybrid" ? basePayload : { ...basePayload, benchmarkModel: benchModel };
        const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const data=await response.json(); if(!response.ok)throw new Error(data?.error||"Analiz başarısız");
        const actual=data.level as RiskLevel; const pass=actual===test.expected;
        setResults(prev=>({...prev,[test.id]:{id:test.id,actual,score:data.score,pass,latencyMs:data?.meta?.latencyMs??Math.round(performance.now()-started),costUsd:data?.meta?.estimatedCostUsd}}));
      }catch(e){setResults(prev=>({...prev,[test.id]:{id:test.id,pass:false,error:e instanceof Error?e.message:"Hata"}}));}
      await new Promise(r=>setTimeout(r,300));
    } setRunning(false);
  }

  const stats=useMemo(()=>{ const rows=Object.values(results); const done=rows.length, passed=rows.filter(r=>r.pass).length; const cost=rows.reduce((a,r)=>a+(r.costUsd||0),0); const latency=rows.reduce((a,r)=>a+(r.latencyMs||0),0);
    let falseNeg=0,falsePos=0; for(const test of cases){const r=results[test.id]; if(!r?.actual)continue; if(test.expected==="high"&&r.actual!=="high")falseNeg++; if(test.expected==="low"&&r.actual!=="low")falsePos++;}
    return{done,passed,rate:done?Math.round((passed/done)*100):0,cost,avgLatency:done?Math.round(latency/done):0,falseNeg,falsePos};
  },[results,cases]);

  function switchSuite(next:Suite){if(!running){setSuite(next);setResults({});}}
  return <main className="labShell">
    <header className="brandRow"><div className="logo">G</div><div><div className="brand">GüvenCheck Lab</div><div className="tagline">V0.5.0 — Terra / Luna A/B benchmark</div></div><a className="labBack" href="/">Uygulamaya dön</a></header>
    <section className="card labIntro"><h1>Benchmark</h1><p className="lead">Testler yalnızca sen başlattığında API çağrısı yapar. Ekran görüntüsü vakaları sentetiktir; gerçek kişisel veri içermez.</p>
      <div className="labTabs labTabs3"><button className={suite==="text"?"active":""} onClick={()=>switchSuite("text")}>24 mesaj</button><button className={suite==="link"?"active":""} onClick={()=>switchSuite("link")}>4 link</button><button className={suite==="image"?"active":""} onClick={()=>switchSuite("image")}>6 ekran görüntüsü</button></div>
      <div className="labModelPicker"><span>Test rotası</span><button className={benchModel==="gpt-5.6-luna"?"active":""} disabled={running} onClick={()=>{setBenchModel("gpt-5.6-luna");setResults({});}}>Luna · tek model</button><button className={benchModel==="gpt-5.6-terra"?"active":""} disabled={running} onClick={()=>{setBenchModel("gpt-5.6-terra");setResults({});}}>Terra · tek model</button><button className={benchModel==="hybrid"?"active":""} disabled={running} onClick={()=>{setBenchModel("hybrid");setResults({});}}>Hibrit · üretim rotası</button></div>
      <button className="primary" disabled={running} onClick={runSuite}>{running?"Testler çalışıyor…":`${cases.length} testi ${benchModel==="hybrid"?"Hibrit":benchModel.endsWith("luna")?"Luna":"Terra"} ile başlat`}</button>
      {stats.done>0&&<div className="labStats labStats5"><div><strong>{stats.rate}%</strong><span>Beklentiyle eşleşme</span></div><div><strong>{stats.falseNeg}</strong><span>Kritik kaçırma</span></div><div><strong>{stats.falsePos}</strong><span>Yanlış alarm</span></div><div><strong>${stats.cost.toFixed(4)}</strong><span>Tahmini API maliyeti</span></div><div><strong>{stats.avgLatency} ms</strong><span>Ort. gecikme</span></div></div>}
    </section>
    <section className="labList">{cases.map(test=>{const r=results[test.id];return <article className="card labCase" key={test.id}><div className="labCaseTop"><div><strong>{test.id.toUpperCase()} · {test.name}</strong><div className="labExpected">Beklenen: {levelTr[test.expected]}</div></div><span className={`labStatus ${!r?"idle":r.pass?"pass":"fail"}`}>{!r?"Bekliyor":r.error?"Hata":r.pass?"Geçti":"İncele"}</span></div>
      {test.type==="image"?<div className={`labShot ${test.style||"sms"}`}><b>{test.sender}</b><span>{test.content}</span></div>:<p>{test.content}</p>}
      {r&&!r.error&&<div className="labResult">Sonuç: <b>{r.score}/100 · {r.actual&&levelTr[r.actual]}</b>{typeof r.costUsd==="number"?` · $${r.costUsd.toFixed(4)}`:""}{r.latencyMs?` · ${r.latencyMs} ms`:""}</div>}{r?.error&&<div className="error">{r.error}</div>}</article>})}</section>
  </main>;
}
