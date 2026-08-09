export default function PrivacyPage() {
  return (
    <main className="shell legalShell">
      <header className="brandRow">
        <div className="logo" aria-hidden="true">G</div>
        <div>
          <div className="brand">GüvenCheck</div>
          <div className="tagline">Beta gizlilik özeti</div>
        </div>
        <a className="vbadge" href="/">Uygulamaya dön</a>
      </header>
      <section className="card legalCard">
        <h1>Gizlilik ve veri kullanımı</h1>
        <p>GüvenCheck beta sürümünde analiz içeriğini kendi veritabanında saklamaz. Mesaj, bağlantı veya ekran görüntüsü analiz yapılabilmesi için sunucu altyapımıza ve kullandığımız AI sağlayıcısına iletilir.</p>
        <h2>Ekran görüntüleri</h2>
        <p>Görseller gönderilmeden önce tarayıcıda küçültülür ve yeniden JPEG olarak kodlanır. Bu işlem dosya boyutunu azaltır ve orijinal dosyadaki bazı metadata alanlarının taşınmasını önler.</p>
        <h2>Beta ölçümleri</h2>
        <p>Ürün kalitesini ölçmek için analiz türü, risk skoru, kullanılan model rotası, gecikme, yaklaşık maliyet ve anonim geri bildirim gibi teknik sinyaller loglanabilir. Analiz metninin veya ekran görüntüsünün kendisini geri bildirim kaydına eklemeyiz.</p>
        <h2>Önemli not</h2>
        <p>GüvenCheck kesin dolandırıcılık veya güvenlik kararı vermez. Para, kimlik, parola, OTP veya başka hassas işlem öncesinde ilgili kurumu bağımsız resmî kanaldan doğrulayın.</p>
        <p className="legalNote">Bu sayfa erken beta için sade bir şeffaflık özetidir; halka açık lansmandan önce KVKK kapsamındaki tam aydınlatma ve kullanım metinleri ayrıca hazırlanacaktır.</p>
      </section>
    </main>
  );
}
