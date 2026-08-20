# Mobil mimari kararı

## Korunan parçalar
- Vercel backend
- Luna → Terra hibrit analiz motoru
- web doğrulama
- Supabase analytics/admin
- risk JSON sözleşmesi

## Yeni mobil katman
- Android: ACTION_SEND intent filtreleri (`expo-sharing` config plugin)
- iOS: Share Extension target + App Group (`expo-sharing` config plugin)
- Ana uygulama ve share handler aynı `Analyzer` bileşenini kullanır.

## Güvenlik
- OpenAI API anahtarı mobil uygulamaya konmaz.
- Mobil uygulama yalnız GüvenCheck backend'ine istek yapar.
- Görsel base64 yalnız analiz isteği sırasında gönderilir.
- Share payload işlendiğinde `clearSharedPayloads()` çağrılır.

## App Store öncesi iOS kapısı
Expo'nun iOS share-to-main-app davranışı experimental. Beta cihaz testlerinde güvenilir değilse:
1. Native Swift Share Extension oluştur.
2. App Group içine küçük payload/temporary-file metadata yaz.
3. Ana app custom URL/deep link üzerinden kontrollü açılır veya extension içinde ön analiz ekranı sunulur.
4. Mevcut `/api/analyze` sözleşmesi değişmez.
