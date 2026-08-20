# GüvenCheck V0.9 Mobile Alpha.1

Bu klasör web/PWA sürümünden ayrı **Android + iOS mobil alpha** projesidir.

## Amaç
- Mevcut `https://guvencheck.vercel.app/api/analyze` backend'ini kullanmak.
- Ekran görüntüsü, mesaj ve link analizi.
- Android Sharesheet'ten `Paylaş → GüvenCheck`.
- iOS Share Extension altyapısını aynı projede üretmek.

## Teknoloji
- Expo SDK 57
- React Native 0.86
- Expo Router
- `expo-sharing` receive/share-target plugin
- `expo-image-picker`

## Önemli iOS notu
Expo SDK 57'de `expo-sharing` iOS Share Extension target'ı oluşturabiliyor; ancak paylaşımdan ana uygulamayı foreground'a getiren akış Expo tarafından **experimental** olarak işaretleniyor. Alpha'da bunu cihazda test edeceğiz. App Store öncesi kararsızlık görürsek native Swift Share Extension'a geçeceğiz; API/arayüz mimarisi buna göre ayrıldı.

## İlk çalışma
Geliştirme build'i gerekir; share target Expo Go içinde gerçek native entegrasyon olarak test edilmez.

```bash
npm install
npx expo-doctor
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

iOS build için daha sonra Apple Developer hesabı gerekir:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## API
Varsayılan backend:
`https://guvencheck.vercel.app`

İstersen `.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://guvencheck.vercel.app
```

## Alpha test sırası
1. Android development build'i telefona kur.
2. Normal ekran görüntüsü seçerek analiz yap.
3. Galeri → Paylaş → GüvenCheck.
4. Chrome → Linki paylaş → GüvenCheck.
5. Metin paylaşımı destekleyen uygulamadan metin gönder.
6. iOS development build alındığında aynı üç share senaryosunu gerçek iPhone'da test et.
