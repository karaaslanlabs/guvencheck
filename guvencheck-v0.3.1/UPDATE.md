# GüvenCheck V0.3.1 — Doğruluk Güncellemesi

Bu sürüm canlı testte görülen URL doğrulama açığını kapatmak için hazırlanmıştır.

## Değişenler
- Link analizinde OpenAI Responses API `web_search` aracı zorunlu kullanılır.
- Exact domain + dolandırıcılık/scam/phishing/şikayet bağlamları araştırılır.
- Marka çağrışımı varsa resmi alan adıyla karşılaştırma istenir.
- Sonuç ekranında `Harici doğrulama` bölümü ve bulunan kaynaklar gösterilir.
- Harici kanıt yoksa sistem bunu "güvenli" olarak yorumlamaz.
- Her AI çağrısının input/output/total token sayısı ile web-search çağrı sayısı Vercel loguna `GUVENCHECK_USAGE` olarak yazılır.
- Arayüz ve health endpoint sürümü V0.3.1'e yükseltildi.

## Test sırası
1. Mesaj: `Hesabınız askıya alınacaktır. Hemen ödeme yapın ve SMS doğrulama kodunuzu paylaşın.`
2. Link: `https://appleturkiye.com/`
3. Bilinen resmi bir site: `https://www.apple.com/tr/`
4. Kendi seçtiğiniz sıradan bir haber/kurum sitesi.

Beklenti: Link analizinde `Web ile doğrulandı` etiketi görünmeli ve harici kaynaklar listelenmelidir.
