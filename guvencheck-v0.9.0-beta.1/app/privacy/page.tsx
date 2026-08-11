import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası — GüvenCheck",
  description: "GüvenCheck gizlilik politikası ve veri işleme açıklamaları.",
};

export default function PrivacyPage() {
  return (
    <main className="shell legalShell">
      <header className="brandRow">
        <div className="logo" aria-hidden="true"><img src="/guvencheck-shield.png" alt="" /></div>
        <div>
          <div className="brand">GüvenCheck</div>
          <div className="tagline">Dijital risk kontrolü</div>
        </div>
        <Link href="/" className="vbadge">Uygulamaya dön</Link>
      </header>

      <article className="card legalCard">
        <div className="eyebrow">KARAASLAN LABS</div>
        <h1>Gizlilik Politikası</h1>
        <p><strong>Son güncelleme:</strong> 11 Ağustos 2026</p>

        <p>GüvenCheck, şüpheli mesajların, bağlantıların ve ekran görüntülerinin dijital risk sinyalleri açısından değerlendirilmesine yardımcı olan bir dijital risk kontrol hizmetidir. Bu politika, GüvenCheck mobil uygulaması ve web hizmeti kullanıldığında hangi bilgilerin işlendiğini, ne amaçla kullanıldığını ve nasıl korunduğunu açıklar.</p>

        <h2>1. İşlediğimiz bilgiler</h2>
        <p>GüvenCheck'i kullanmak için kullanıcı hesabı oluşturmanız gerekmez. Ad, telefon numarası veya e-posta adresiyle kayıt talep etmiyoruz.</p>
        <p>Bir analiz başlattığınızda kendi isteğinizle mesaj veya metin, internet bağlantısı (URL) ya da ekran görüntüsü gönderebilirsiniz. Bu içerikler yalnızca talep ettiğiniz risk analizini gerçekleştirmek ve sonucu size sunmak amacıyla işlenir.</p>
        <p>Gönderdiğiniz içerik kişisel, finansal veya başka hassas bilgiler içerebilir. Analiz için gerekli olmayan parola, tek kullanımlık doğrulama kodu, tam kart bilgisi veya benzeri kritik bilgileri göndermemenizi öneririz.</p>

        <h2>2. Analiz içeriğini nasıl kullanıyoruz?</h2>
        <p>Gönderilen içerik GüvenCheck'in analiz altyapısına iletilir ve dolandırıcılık, kimlik avı, sosyal mühendislik, sahte kurum, ödeme baskısı ve benzeri dijital risk sinyallerinin değerlendirilmesi için işlenir.</p>
        <p>GüvenCheck; analiz edilen mesajın, URL'nin veya ekran görüntüsünün kendisini ürün analitiği veritabanında saklamaz. Bununla birlikte, analizi gerçekleştirmek için içerik sunucu altyapımız ve yapay zekâ hizmet sağlayıcılarımız tarafından teknik olarak işlenebilir.</p>

        <h2>3. Ürün analitiği</h2>
        <p>Hizmetin güvenilirliğini, performansını ve kullanıcı deneyimini ölçmek amacıyla sınırlı anonim veya takma adlı teknik bilgiler tutulabilir:</p>
        <ul>
          <li>anonim uygulama veya tarayıcı kimliği ve oturum bilgisi,</li>
          <li>analiz türü (mesaj, link veya ekran görüntüsü),</li>
          <li>risk skoru ve risk seviyesi,</li>
          <li>kullanılan analiz rotası,</li>
          <li>analiz süresi ve hata bilgisi,</li>
          <li>“Bu sonuç işine yaradı mı?” geri bildirimi,</li>
          <li>paylaşım akışının başlatıldığı bilgisi.</li>
        </ul>
        <p>Bu analitik kayıtlarda gönderdiğiniz mesajın metni, kontrol edilen URL'nin kendisi veya ekran görüntüsünün kendisi tutulmaz.</p>

        <h2>4. Hizmet sağlayıcıları ve veri aktarımı</h2>
        <p>GüvenCheck'in çalışması için barındırma, veritabanı, ürün analitiği ve yapay zekâ işleme hizmetleri sağlayan üçüncü taraf teknik hizmet sağlayıcılarından yararlanabiliriz. Bu sağlayıcılar verileri ilgili hizmetin sunulması, güvenliğin sağlanması veya yasal yükümlülüklerin yerine getirilmesi kapsamında işleyebilir.</p>
        <p>GüvenCheck kullanıcı verilerini reklam verenlere satmaz ve kişiselleştirilmiş reklam profilleri oluşturmak amacıyla kullanmaz.</p>

        <h2>5. Yapay zekâ ile işleme</h2>
        <p>Analiz sırasında gönderdiğiniz içerik, risk analizini gerçekleştirmek amacıyla yapay zekâ hizmet sağlayıcımıza iletilebilir. Bu işleme yalnızca istediğiniz analiz sonucunu üretmek için yapılır.</p>
        <p>Yapay zekâ hizmet sağlayıcısının kendi güvenlik, kötüye kullanımın önlenmesi ve yasal yükümlülükleri kapsamında teknik kayıtları veya sınırlı süreli saklama uygulamaları bulunabilir. Bu nedenle “GüvenCheck veritabanında saklanmaz” ifadesi, üçüncü taraf sağlayıcıların zorunlu teknik kayıtlarını kapsamaz.</p>

        <h2>6. Veri güvenliği</h2>
        <p>Verilerin aktarımı sırasında HTTPS/TLS gibi standart güvenli iletişim yöntemleri kullanılır. GüvenCheck, analiz için gerekli olmayan hassas bilgilerin gönderilmemesini önerir.</p>

        <h2>7. Veri saklama ve silme</h2>
        <p>Analiz edilen mesaj, URL veya ekran görüntüsü GüvenCheck'in ürün analitiği veritabanında kalıcı olarak saklanmaz. Anonim veya takma adlı ürün analitiği kayıtları hizmetin güvenilirliği, hata analizi ve ürün geliştirme amaçlarıyla tutulabilir.</p>
        <p>Üçüncü taraf teknik hizmet sağlayıcılarının güvenlik veya sistem kayıtları kendi saklama politikalarına tabi olabilir.</p>
        <p>GüvenCheck şu anda kullanıcı hesabı oluşturmadığından hesap silme işlemi bulunmamaktadır. Elimizde sizinle ilişkilendirilebilir bir veri bulunduğunu düşünüyorsanız silme veya gizlilik talebi için privacy@karaaslanlabs.com adresi üzerinden bize ulaşabilirsiniz.</p>

        <h2>8. Paylaşım özelliği</h2>
        <p>GüvenCheck sonucu, kullanıcı tarafından isteğe bağlı olarak cihazın sistem paylaşım özelliği üzerinden başka uygulamalarla paylaşılabilir. Paylaşım akışının başlatıldığı anonim ürün metriği olarak kaydedilebilir; ancak hangi kişiyle veya hangi uygulamayla gerçekten paylaşım yaptığınız GüvenCheck tarafından takip edilmez.</p>

        <h2>9. Çocukların gizliliği</h2>
        <p>GüvenCheck özellikle çocuklara yönelik bir hizmet olarak tasarlanmamıştır ve bilerek çocuklardan kişisel veri toplamayı amaçlamaz.</p>

        <h2>10. İletişim</h2>
        <p><strong>Karaaslan Labs</strong><br />
        Gizlilik: <a href="mailto:privacy@karaaslanlabs.com">privacy@karaaslanlabs.com</a><br />
        Destek: <a href="mailto:support@karaaslanlabs.com">support@karaaslanlabs.com</a><br />
        Güvenlik: <a href="mailto:security@karaaslanlabs.com">security@karaaslanlabs.com</a></p>

        <h2>11. Politika değişiklikleri</h2>
        <p>Hizmet veya veri işleme uygulamalarımız değişirse bu Gizlilik Politikası güncellenebilir. Güncel sürüm her zaman bu sayfada yayımlanır.</p>

        <p className="legalNote">GüvenCheck kesin bir dolandırıcılık kararı vermez; risk sinyallerini değerlendirir. Finansal veya hassas işlem yapmadan önce ilgili kurumu kendi resmî kanalından bağımsız olarak doğrulayın.</p>
      </article>

      <footer>GüvenCheck · Karaaslan Labs · Göndermeden. Ödemeden. Tıklamadan önce.</footer>
    </main>
  );
}
