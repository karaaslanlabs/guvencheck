export type OfficialSafePath = {
  kind: 'bank' | 'public' | 'delivery' | 'commitment' | 'commerce';
  title: string;
  action: string;
};

export function deriveOfficialSafePath(input: {
  type: 'text' | 'link' | 'image';
  text?: string;
  analysis?: any;
}): OfficialSafePath | null {
  const a = input.analysis || {};
  const evidence = [
    input.text || '',
    a.title || '',
    a.summary || '',
    a.manipulationSummary || '',
    ...(Array.isArray(a.signals) ? a.signals : []),
    ...(Array.isArray(a.actions) ? a.actions : []),
  ].join(' ').toLocaleLowerCase('tr-TR');

  if (/(banka|bankası|iban|eft|havale|kredi kart|kart bilg|otp|doğrulama kodu|sms kodu)/i.test(evidence)) {
    return {
      kind: 'bank',
      title: 'Bankanın kendi kanalından doğrula',
      action: 'Mesajdaki link veya numarayı kullanma. Bankanın resmî mobil uygulamasını aç ya da kartın arkasındaki müşteri hizmetleri numarasını kendin ara.',
    };
  }
  if (/(e-devlet|turkiye\.gov\.tr|vergi|icra|mahkeme|polis|savcı|jandarma|bakanlık|belediye)/i.test(evidence)) {
    return {
      kind: 'public',
      title: 'Resmî kamu kanalından kontrol et',
      action: 'Mesajdaki bağlantıyı açma. e-Devlet uygulamasını veya turkiye.gov.tr adresini kendin aç; gerekiyorsa ilgili kurumun resmî .gov.tr kanalına oradan geç.',
    };
  }

  if (/(hgs|ptt|kargo|teslimat|paket|gönderi|kurye)/i.test(evidence)) {
    return {
      kind: 'delivery',
      title: 'Gönderiyi resmî kanaldan sorgula',
      action: 'Mesajdaki takip veya ödeme bağlantısını kullanma. Kargo şirketinin ya da ilgili resmî hizmetin uygulamasını/site adresini kendin açıp takip numarasını orada kontrol et.',
    };
  }
  if (/(abonelik|taahhüt|yenileme|iptal|cayma|deneme süresi|trial|subscription)/i.test(evidence)) {
    return {
      kind: 'commitment',
      title: 'Koşulları sağlayıcının kendi hesabından doğrula',
      action: 'Mesajdaki yönlendirme yerine sağlayıcının kendi uygulama/hesap alanını aç. Yenileme, iptal, cayma ve ücret koşullarını oradaki resmî sözleşme/hesap ekranından kontrol et.',
    };
  }

  if (/(satıcı|mağaza|alışveriş|ödeme|kapora|sipariş|checkout|pazar yeri|ürün ilanı)/i.test(evidence)) {
    return {
      kind: 'commerce',
      title: 'Ödemeyi platformun korumalı akışında tut',
      action: 'Mesajla verilen haricî ödeme kanalına geçme. Satıcıyı ve siparişi platformun kendi hesap/checkout ekranından doğrula; mümkünse alıcı koruması sunan ödeme akışını kullan.',
    };
  }

  return null;
}
