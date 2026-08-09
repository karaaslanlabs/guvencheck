# GüvenCheck V0.5.2 — Dayanıklılık düzeltmesi

V0.5.2, V0.5.1 hibrit Luna → Terra mimarisini korur. Görselde URL bulunduğunda Terra/web ikinci aşamasında oluşabilen geçici structured-output hatalarına karşı:

- HTTP ve timeout retry
- eksik/yarım structured-output retry
- daha geniş çıktı token bütçesi
- ikinci aşama başarısızsa kullanıcıya ilk Luna analizini güvenli fallback olarak gösterme
- başarısız doğrulamayı hiçbir zaman "web doğrulandı" diye sunmama
- request ID ve escalation fallback logları

ekler.
