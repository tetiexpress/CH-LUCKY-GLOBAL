# CH Lucky Global — Kurumsal Web Sitesi

Kosova merkezli, resmi Wolt teslimat partner acentası CH Lucky Global için hazırlanmış, 3 dilli (Arnavutça / İngilizce / Türkçe) kurumsal tanıtım sitesi ve kurye başvuru formu.

## İçerik

- **Anasayfa / Hakkımızda / Vizyon & Misyon / İlkelerimiz** — tanıtım sayfaları
- **Kurye Başvurusu** — Firebase Firestore'a kaydedilen başvuru formu + WhatsApp hızlı başvuru
- **İletişim** — adres, WhatsApp, e-posta, sosyal medya
- Cihaz diline göre otomatik dil algılama (SQ / EN / TR), üstten manuel dil değiştirme

## Klasör Yapısı

```
index.html
css/style.css
js/i18n.js              → dil algılama ve çeviri motoru
js/main.js               → menü, form doğrulama, gönderim akışı
js/firebase-config.js    → Firebase proje anahtarları (doldurulacak)
js/firebase-init.js      → Firestore bağlantısı ve başvuru gönderimi
i18n/en.json, sq.json, tr.json → tüm site metinleri
assets/img/              → logo, favicon (gerçek logo dosyalarınızla değiştirilecek)
firebase.json, .firebaserc, firestore.rules → Firebase Hosting/Firestore yapılandırması
```

## 1. Gerçek Logo ve Görselleri Ekleme

`assets/img/logo.svg`, `favicon.svg` ve `wolt-mark.svg` şu an marka renklerinize uygun **yer tutucu** (placeholder) tasarımlardır. Gerçek logonuzu ve tanıtım posterinizi kullanmak için:

1. Dosyaları `assets/img/` klasörüne kopyalayın (örn. `logo.png`, `favicon.png`).
2. `index.html` içinde `assets/img/logo.svg` ve `assets/img/favicon.svg` referanslarını yeni dosya adlarıyla değiştirin.

## 2. Firebase Projesi Kurulumu

1. [Firebase Console](https://console.firebase.google.com)'da yeni bir proje oluşturun.
2. **Build → Firestore Database** bölümünden Firestore'u etkinleştirin (production mode).
3. **Project settings → General → Your apps**'ten bir Web App ekleyin ve verilen config nesnesini kopyalayın.
4. `js/firebase-config.js` dosyasındaki `REPLACE_WITH_...` alanlarını bu bilgilerle doldurun.
5. `.firebaserc` dosyasındaki `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` değerini gerçek proje ID'niz ile değiştirin.

> Not: Firestore güvenlik kuralları (`firestore.rules`) yalnızca **yeni başvuru oluşturmaya (create)** izin verir; başvuruları okumak/silmek yalnızca Firebase Console üzerinden mümkündür. Bu, herkese açık sitenin veritabanınızı okuyamamasını sağlar.

## 3. Yerel Test

Tarayıcılar güvenlik nedeniyle `file://` üzerinden yerel JSON dosyalarının okunmasını engelleyebilir. Bu yüzden basit bir yerel sunucu ile test edin:

```bash
npm install -g firebase-tools
firebase login
firebase serve
```

veya Firebase kurmadan hızlı test için:

```bash
python3 -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080` adresini açın.

## 4. Firestore Kurallarını ve Siteyi Yayınlama

```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

İkisini birden yayınlamak için:

```bash
firebase deploy
```

## 5. Gelen Kurye Başvurularını Görüntüleme

Firebase Console → Firestore Database → `courier_applications` koleksiyonu altında tüm başvurular; ad, telefon, e-posta, şehir, araç tipi, ehliyet durumu, müsaitlik, mesaj, dil ve gönderim tarihi ile birlikte listelenir.

## 6. Alan Adı, robots.txt ve sitemap.xml

`robots.txt` ve `sitemap.xml` içindeki `REPLACE_WITH_YOUR_DOMAIN` ifadesini, siteyi bağlayacağınız gerçek alan adıyla (veya `your-project.web.app` ile) güncelleyin.

## 7. İçerik/Metin Güncellemeleri

Tüm site metinleri `i18n/en.json`, `i18n/sq.json`, `i18n/tr.json` dosyalarında tutulur. Herhangi bir metni güncellemek için ilgili anahtarı üç dilde de güncellemeniz yeterlidir — HTML dosyasına dokunmanıza gerek yoktur.
