# GüvenCheck V0.5.1 — Hibrit yönlendirme

V0.5.1 üretim analizinde maliyet/kalite dengesini otomatik yönetir:

- Mesaj ve ekran görüntüsü önce `gpt-5.6-luna` ile hızlı taranır.
- 25–75 gri bölge, düşük kanıt gücü, kritik terimlerde belirsizlik veya görsel/metin içinde URL bulunması durumunda `gpt-5.6-terra` ikinci görüş verir.
- Görsel/metin içinde URL bulunduğunda Terra ikinci görüşünde web doğrulaması açılır.
- Doğrudan Link sekmesi Terra + web doğrulaması kullanır.
- `/lab` sayfasında Luna, Terra ve gerçek Hibrit rota ayrı ayrı test edilebilir.
- `Test ölçümü` toplam rota maliyetini, tokenları ve Terra'ya yükseltilip yükseltilmediğini gösterir.

## Ortam değişkenleri

```text
OPENAI_API_KEY=...
OPENAI_FAST_MODEL=gpt-5.6-luna
OPENAI_DEEP_MODEL=gpt-5.6-terra
```

FAST/DEEP değişkenleri eklenmezse uygulama bu iki varsayılan modeli otomatik kullanır.
