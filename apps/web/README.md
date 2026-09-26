# GüvenCheck Web

GüvenCheck'in Next.js tabanlı web uygulaması ve analiz backend'i.

## Sorumluluklar

- Mesaj, link/web içeriği ve görsel/screenshot analiz akışları
- Risk sonucunu açıklama ve güvenli sonraki adım yönlendirmesi
- Ürün geri bildirimi ve anonim telemetri
- Admin/evidence yüzeyleri
- Ekonomik güvenlik kontrolleri
- Gizlilik odaklı analiz tekrar-kullanım yolları

## Geliştirme

```bash
npm install
npm run dev
```

Kontroller:

```bash
npm run typecheck
npm test
npm run build
```

## Environment

`OPENAI_API_KEY` zorunludur. `OPENAI_MODEL` mevcut kurulumla kullanılabilir. `BETA_ACCESS_KEY` ve `LAB_ACCESS_KEY` opsiyoneldir.

## Durum

Web uygulaması aktif ürün doğrulama / kapalı test hattındadır. Bu dosyada sabit ürün sürüm etiketi tutulmaz; güncel repository/genel ürün durumu için kök [README](../../README.md) esas alınır.
