# GüvenCheck V0.4.2

Bu sürüm üretim modelini değiştirmez. Ana uygulama varsayılan olarak Vercel'deki `OPENAI_MODEL` değerini kullanmaya devam eder.

## Yeni: Terra / Luna A/B Lab

`/lab` sayfasında benchmark modeli seçilebilir:
- GPT-5.6 Luna — düşük maliyet / yüksek hacim adayı
- GPT-5.6 Terra — mevcut kalite referansı

Aynı 24 mesaj, 4 link ve 6 sentetik ekran görüntüsü seti iki modelle karşılaştırılabilir. Amaç, hibrit yönlendirmeye geçmeden önce Luna'nın kritik kaçırma ve yanlış alarm oranını gerçek GüvenCheck vakalarında ölçmektir.

## Karar kuralı

Luna ancak şu koşullarda ilk-tarama modeli adayı olacak:
- kritik kaçırma = 0,
- yanlış alarm Terra'dan anlamlı biçimde kötü değil,
- belirsiz vakalarda aşırı özgüvenli değil,
- maliyet ve/veya gecikmede anlamlı avantaj sağlıyor.

Bu sürümde otomatik hibrit yönlendirme henüz aktif değildir.
