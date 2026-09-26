# GüvenCheck — Historical Product Notes (V0.6.1)

> This file is retained as historical product-validation context. It does **not** represent the current repository/product status. For the current public overview, use the root [README](../../README.md).

## Çekirdek değer

Kullanıcı şüpheli mesaj, link veya ekran görüntüsünü gönderir; GüvenCheck risk sinyallerini sade Türkçeyle açıklar ve güvenli sonraki adımı önerir.

## O dönemde kanıtlanan erken sinyaller

- Sentetik mesaj benchmarklarında kritik kaçırma gözlenmedi.
- Luna maliyet avantajı sağlarken Terra gri/kritik vakalarda kalite valfi olarak kullanılıyordu.
- Gerçek testlerde bonus/kısaltılmış linkli şüpheli SMS yüksek risk, doğrulanabilir AgeSA bildirimi düşük risk bandında ayrıştırıldı.

## V0.6.1 hedefi

Model seçmekten çıkıp kapalı beta ürününü hazırlamak:

- kötüye kullanım sınırı
- minimum anonim telemetry
- kullanıcı geri bildirimi
- gizlilik şeffaflığı
- stabil mobil akış

## V0.6.1 dönemindeki sonraki hedef

20 gerçek beta kullanıcıyla şu metrikleri ölçmek:

- analizi tamamlayan kullanıcı oranı
- sonuç faydalı mı geri bildirimi
- tekrar kullanım
- paylaşım davranışı
- kritik yanlış negatifler
- yanlış alarm oranı
- sorgu başı gerçek API maliyeti
