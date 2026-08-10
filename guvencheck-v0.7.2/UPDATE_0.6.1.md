# GüvenCheck V0.6.1 — Kapalı beta temizliği

- Ana sayfadaki Lab bağlantısı kaldırıldı.
- Son kullanıcı sonuç ekranındaki Test ölçümü paneli kaldırıldı.
- Footer yalnızca Gizlilik bağlantısını gösterir.
- /lab varsayılan olarak kapalıdır.
- Lab erişimi için Vercel'de `LAB_ACCESS_KEY` tanımlanmalıdır.
- `/lab` açıldığında tarayıcı Basic Auth penceresi gösterir. Kullanıcı adı herhangi bir değer olabilir; parola `LAB_ACCESS_KEY` değeridir.
- `LAB_ACCESS_KEY` tanımlı değilse `/lab` 404 döndürür.
- Sürüm etiketi kapalı beta için sadeleştirildi.
