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
        <p><strong>Son güncelleme:</strong> 15 Eylül 2026</p>
        <p>
          GüvenCheck, Karaaslan Labs tarafından sunulan Türkiye odaklı dijital risk
          karar destek ürünüdür. Gizlilikle ilgili sorular için
          {' '}<a href="mailto:contact@karaaslanlabs.com">contact@karaaslanlabs.com</a>
          {' '}adresine ulaşabilirsiniz.
        </p>

        <h2>Hangi içerikler analiz edilir?</h2>
        <p>
          Kullandığınız özelliğe göre gönderdiğiniz mesaj metni, bağlantı/URL veya
          ekran görüntüsü analiz edilir. Bu içerik GüvenCheck sunucu altyapısına
          güvenli bağlantı üzerinden iletilir ve talep ettiğiniz risk analizini
          üretmek için işlenir.
        </p>
        <h2>AI ve harici doğrulama</h2>
        <p>
          GüvenCheck analizlerinde OpenAI altyapısından yararlanır. Analiz istekleri
          kalıcı model depolaması kapalı olacak şekilde <code>store: false</code>
          ile gönderilir. Bununla birlikte OpenAI&apos;nin güvenlik, kötüye kullanımın
          önlenmesi ve yasal yükümlülükler için uyguladığı teknik kayıt süreçleri
          kendi politikalarına tabidir.
        </p>
        <p>
          Bağlantı analizlerinde risk belirsizse güncel web doğrulaması kullanılabilir.
          Bu durumda ilgili alan adı veya bağlantı, bağımsız risk sinyallerini araştırmak
          için arama sorgularının parçası olabilir. Arama sonucu bulunmaması bir sitenin
          güvenli olduğu anlamına gelmez.
        </p>

        <h2>Ürün analitiği ve ekonomik telemetri</h2>
        <p>
          Ürünün güvenilirliğini, kullanımını ve AI maliyetini ölçmek için rastgele/pseudonim
          kurulum/oturum kimliği, analiz türü, risk skoru/seviyesi, analiz rotası,
          gecikme, başarı/hata, geri bildirim, paylaşım akışının başlatılması,
          token/web araması kullanımı ve tahmini API maliyeti gibi teknik sinyaller
          kaydedilebilir.
        </p>
        <p>
          Gönderdiğiniz ham mesaj, URL veya ekran görüntüsü bu ürün analitiği ve
          ekonomik telemetri kayıtlarının içine yazılmaz.
        </p>
        <h2>Cihazda saklanan koruma verileri</h2>
        <p>
          Mobil uygulamada Korumaya Al özelliğini kullanırsanız yalnız yapılandırılmış
          bir koruma özeti cihazınızda saklanır: başlık, sağlayıcı, kritik tarih,
          sıradaki aksiyon, kısa özet ve bildirim planlama bilgileri. Ham analiz
          mesajı, URL&apos;si veya ekran görüntüsü bu yerel koruma dosyasına kopyalanmaz.
        </p>
        <p>
          Aktif korumayı uygulama içindeki “Koruma kaydını kaldır” seçeneğiyle
          silebilirsiniz. Bildirim izni yalnız siz Korumaya Al akışını seçtiğinizde
          istenir; SMS, çağrı veya erişilebilirlik izni talep edilmez.
        </p>

        <h2>Bağlantı sonuçlarının yeniden kullanımı</h2>
        <p>
          Uygun bağlantı analizlerinde maliyet ve gecikmeyi azaltmak için daha önceki
          doğrulanmış bir sonuç sınırlı süreyle yeniden kullanılabilir. Bu mekanizmada
          ham URL yerine sunucu tarafındaki gizli anahtarla türetilmiş bir fingerprint,
          sınırlı analiz sonucu ve teknik metadata saklanır.
        </p>

        <h2>Hesap ve kimlik</h2>
        <p>
          GüvenCheck&apos;in mevcut sürümünde kullanıcı hesabı oluşturma veya giriş yapma
          özelliği yoktur. Mobil uygulama tekrar kullanım ölçümü için kişisel hesaba
          bağlı olmayan rastgele bir kurulum kimliği üretir.
        </p>
        <h2>Hizmet sağlayıcıları ve altyapı</h2>
        <p>
          GüvenCheck; uygulama barındırma/sunucu işlemleri, AI analizi ve sınırlı ürün
          telemetrisi için üçüncü taraf hizmet sağlayıcılarından yararlanır. Mevcut
          altyapıda Vercel barındırma, OpenAI analiz ve Supabase ürün ve ekonomik telemetri
          işlevlerinde kullanılır. Bu sağlayıcıların kendi güvenlik ve teknik kayıt
          süreçleri kendi sözleşme ve politikalarına tabidir.
        </p>

        <h2>Veri satışı ve reklam</h2>
        <p>
          Analiz içeriğini satmıyoruz ve kişiselleştirilmiş reklam hedeflemesi için
          kullanmıyoruz. GüvenCheck&apos;in mevcut sürümünde reklam SDK&apos;sı bulunmaz.
        </p>

        <h2>Saklama, silme ve başvurular</h2>
        <p>
          Analiz girdilerini GüvenCheck ürün analitiği veritabanına kalıcı içerik
          kaydı olarak yazmıyoruz. Teknik telemetry ve ekonomik kayıtlar ürün güvenliği,
          kalite ve maliyet kontrolü için gerekli olduğu sürece tutulabilir. Hizmet
          sağlayıcılarının güvenlik/kötüye kullanım kayıtları kendi saklama kurallarına tabidir.
        </p>
        <p>
          Mevcut sürüm hesapsız olduğu için pseudonymous teknik kayıtlar her zaman belirli bir
          gerçek kişiyle ilişkilendirilemeyebilir. Veri veya gizlilik talebiniz için
          {' '}<a href="mailto:contact@karaaslanlabs.com">contact@karaaslanlabs.com</a>
          {' '}adresinden bizimle iletişime geçebilirsiniz.
        </p>
        <h2>Güvenlik ve sonuçların kapsamı</h2>
        <p>
          GüvenCheck kesin bir dolandırıcılık veya güvenlik kararı vermez; risk
          sinyallerini değerlendirir. Belirgin risk sinyali bulunmaması, bir içeriğin
          kesin olarak güvenli olduğu anlamına gelmez. Para, kimlik, parola, OTP veya
          başka hassas bir işlem öncesinde ilgili kurumu kendi bağımsız resmî kanalından
          doğrulayın.
        </p>

        <h2>Türkiye / KVKK</h2>
        <p className="legalNote">
          Bu politika GüvenCheck&apos;in mevcut web ve mobil ürün davranışını açıklar.
          Türkiye&apos;deki kişisel veri hakları veya veri işleme hakkında bir talebiniz
          varsa Karaaslan Labs ile iletişime geçebilirsiniz. Ürün davranışı veya veri
          işleme şekli değişirse bu politika ve Google Play Data Safety beyanları da
          güncellenecektir.
        </p>
      </section>
    </main>
  );
}
