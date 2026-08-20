export default function PrivacyPage() {
  return (
    <main className="shell legalShell">
      <header className="brandRow">
        <div className="logo" aria-hidden="true">
          <img src="/brand/guvencheck-mark-512.png" alt="" />
        </div>
        <div>
          <div className="brand">GüvenCheck</div>
          <div className="tagline">Gizlilik ve veri kullanımı</div>
        </div>
        <a className="vbadge" href="/">Uygulamaya dön</a>
      </header>

      <section className="card legalCard">
        <h1>Gizlilik ve veri kullanımı</h1>

        <p>
          GüvenCheck; mesaj, bağlantı ve ekran görüntüsü gibi şüpheli dijital
          içerikleri analiz etmek için çalışır. Analiz ettiğiniz içeriği
          GüvenCheck&apos;in kendi ürün analitiği veritabanında saklamıyoruz.
          İçerik, analiz yapılabilmesi için sunucu altyapımıza ve analiz
          sağlayıcımıza iletilir.
        </p>

        <h2>Analiz için hangi veriler işlenir?</h2>
        <p>
          Kullandığınız özelliğe göre analiz edilmesini istediğiniz mesaj metni,
          bağlantı veya ekran görüntüsü işlenir. Bu içerik yalnızca talep
          ettiğiniz risk analizini gerçekleştirmek için kullanılır.
        </p>

        <h2>AI sağlayıcısı</h2>
        <p>
          GüvenCheck analizlerinde OpenAI altyapısından yararlanır. OpenAI&apos;ye
          gönderilen analiz isteklerinde kalıcı model depolaması kapalı olacak
          şekilde <code>store: false</code> kullanılır. Bununla birlikte,
          sağlayıcının güvenlik, kötüye kullanımın önlenmesi ve yasal
          yükümlülükler kapsamında uyguladığı teknik kayıt süreçleri kendi
          politikalarına tabi olabilir.
        </p>

        <h2>Ekran görüntüleri</h2>
        <p>
          Web sürümünde seçilen görseller gönderilmeden önce küçültülebilir ve
          yeniden kodlanabilir. Bu işlem dosya boyutunu azaltmaya ve orijinal
          dosyadaki bazı metadata alanlarının taşınmasını sınırlamaya yardımcı
          olur. Mobil uygulamada da analiz için gerekli görsel veri güvenli
          bağlantı üzerinden sunucuya iletilir.
        </p>

        <h2>Ürün analitiği ve geri bildirim</h2>
        <p>
          Ürünün performansını ve sonuç kalitesini ölçmek için anonim oturum
          kimliği, analiz türü, risk skoru ve seviyesi, kullanılan analiz rotası,
          yaklaşık gecikme, paylaşım akışının başlatılması ve
          faydalı/faydasız geri bildirim gibi teknik ürün sinyalleri
          kaydedilebilir.
        </p>
        <p>
          Analiz ettiğiniz mesajın, bağlantının veya ekran görüntüsünün kendisini
          bu analitik ve geri bildirim kayıtlarının içine eklemiyoruz.
        </p>

        <h2>Verileri satıyor muyuz veya reklam amacıyla kullanıyor muyuz?</h2>
        <p>
          Analiz içeriğini satmıyoruz ve kişiselleştirilmiş reklam amacıyla
          kullanmıyoruz.
        </p>

        <h2>Güvenlik ve sonuçların kapsamı</h2>
        <p>
          GüvenCheck kesin bir dolandırıcılık veya güvenlik kararı vermez; risk
          sinyallerini değerlendirir. Belirgin risk sinyali bulunmaması, bir
          içeriğin kesin olarak güvenli olduğu anlamına gelmez. Para, kimlik,
          parola, OTP veya başka hassas bir işlem öncesinde ilgili kurumu kendi
          bağımsız resmî kanalından doğrulayın.
        </p>

        <h2>KVKK ve aydınlatma</h2>
        <p className="legalNote">
          Bu sayfa GüvenCheck&apos;in mevcut ürün davranışını açıklayan sade
          gizlilik özetidir. Ürün halka açık kullanıma genişletilmeden önce KVKK
          kapsamındaki gerekli aydınlatma, saklama, başvuru ve iletişim
          metinleri ayrıca yayımlanacaktır.
        </p>
      </section>
    </main>
  );
}
