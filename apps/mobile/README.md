# GüvenCheck Mobile

Bu klasör GüvenCheck'in Android + iOS mobil uygulamasını içerir.

## Amaç

- Mevcut GüvenCheck analiz backend'ini kullanmak
- Ekran görüntüsü/görsel, mesaj ve link analizi
- Android Sharesheet üzerinden `Paylaş → GüvenCheck`
- iOS Share Extension altyapısını aynı mobil projede sürdürmek

## Teknoloji

- Expo SDK 57
- React Native 0.86
- Expo Router
- `expo-sharing` receive/share-target plugin
- `expo-image-picker`

## Güvenlik sınırı

OpenAI/API sağlayıcı anahtarları mobil istemciye konmaz. Mobil uygulama analiz isteklerini GüvenCheck backend'ine gönderir.

## Geliştirme

```bash
npm install
npm run doctor
npm run typecheck
npm run start
```

Native share-target davranışı için development build gerekir; Expo Go bu entegrasyonun tamamını doğrulamaz.

Android development build örneği:

```bash
npx eas-cli@latest build --profile development --platform android
```

iOS development build için Apple Developer hesabı gerekir:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## iOS share-extension notu

Expo SDK 57'de `expo-sharing` iOS Share Extension target'ı oluşturabiliyor; share-to-main-app davranışı cihaz üzerinde ayrıca doğrulanmalıdır. Ayrıntılı mimari ve fallback kararı için [MOBILE_ARCHITECTURE.md](MOBILE_ARCHITECTURE.md) dosyasına bakın.

## Backend

Varsayılan backend:

```text
https://guvencheck.vercel.app
```

Gerekirse:

```bash
EXPO_PUBLIC_API_BASE_URL=https://guvencheck.vercel.app
```

## Durum

Mobil uygulama aktif kapalı test / cihaz doğrulama hattındadır. Güncel repository/genel ürün durumu için kök [README](../../README.md) esas alınır.
