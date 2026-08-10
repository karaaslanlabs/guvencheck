# GüvenCheck V0.5.1

Bu sürüm gerçek kullanıcı testlerinde yakalanan iki probleme odaklanır.

## 1. Analiz dayanıklılığı
- OpenAI 429, 5xx ve zaman aşımı durumlarında en fazla bir kontrollü otomatik tekrar deneme.
- Hata devam ederse kullanıcıya kısa hata kodu (`requestId`) gösterilir.
- Aynı kod Vercel loglarında aranabilir.

## 2. Domain Trust Layer
- Görsel veya metinden çıkarılan URL için hostname ve registrable/root domain ayrıştırılır.
- `link.agesa.com.tr` gibi gerçek bir alt alan adı, `agesa.com.tr` kök alan adıyla deterministik olarak ilişkilendirilir.
- Web doğrulamasında model önce root domainin iddia edilen markanın resmî domaini olup olmadığını araştırır.
- Resmî root domain doğrulanırsa alt alan sırf farklı hostname olduğu için marka taklidi sayılmaz.
- HTTP kullanımı tek başına dolandırıcılık kanıtı değildir; yalnızca ek risk sinyalidir.

Not: Bu katman bir domaini otomatik olarak “kesin güvenli” ilan etmez. İçerik ve işlem talebi ayrıca değerlendirilir.
