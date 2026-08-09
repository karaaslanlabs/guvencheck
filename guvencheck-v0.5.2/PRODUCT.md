# GüvenCheck V0.5.2 — ilk hibrit üretim mimarisi

## Benchmark kararı

Ölçülen testlerde Luna, kritik dolandırıcılık vakalarını kaçırmadan Terra'dan belirgin şekilde daha düşük maliyet ve daha düşük gecikme sundu. Sapmalar ağırlıklı olarak belirsiz 25–75 skor bandında oluştu. Bu nedenle V0.5.2 tek-model seçimi yerine yönlendirme kullanır.

## Rota

1. Mesaj/görsel → Luna ilk görüş.
2. Skor 25–75 ise Terra ikinci görüş.
3. Luna kanıt gücü düşükse Terra ikinci görüş.
4. Görselde URL çıkarılırsa Terra + web doğrulaması.
5. Metinde URL + belirsizlik varsa Terra + web doğrulaması.
6. Kritik ödeme/OTP/uzaktan erişim terimleri Luna tarafından net sınıflanmadıysa Terra.
7. Doğrudan link kontrolü → Terra + web.

Bu eşikler kalıcı değildir; gerçek kullanıcı verisi ve daha geniş benchmark ile yeniden kalibre edilecektir.
