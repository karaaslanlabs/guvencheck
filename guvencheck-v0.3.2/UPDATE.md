# GüvenCheck V0.3.2 — Sonuç kalitesi sürümü

Bu sürüm V0.3.1 canlı testlerinden sonra hazırlandı.

- Link sonuçlarındaki ham Markdown/URL kalabalığı temizlenir.
- Harici doğrulama bölümü varsayılan olarak kısa görünür; kullanıcı isterse açar.
- `Web ile doğrulandı` yerine daha doğru olan `Web taraması yapıldı` ifadesi kullanılır.
- Hedef sitenin kendi içeriği bağımsız güven kanıtı sayılmaz.
- Şikâyet platformları kullanıcı bildirimi olarak çerçevelenir, resmî kanıt gibi sunulmaz.
- Kaynak kartları `Hedef site`, `Kullanıcı bildirimleri`, `Resmî kaynak`, `Harici kaynak` diye etiketlenir.
- `Güven düzeyi` yerine `Kanıt gücü` gösterilir; risk skoru ile karışması azaltılır.
- URL için HTTPS, kullanıcı bilgisi, punycode, IP-host, port, subdomain ve sorgu özellikleri deterministik olarak modele verilir.
- Çıktı daha kısa tutulur ve link analizi token bütçesi düşürülür.
