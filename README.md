# Market Asistan (MVP)

Kişisel mutfak ve alışveriş asistanı — kiler takibi, tarif eşleştirme, market listesi,
harcama takibi ve su takibi. Veriler telefonda **localStorage** ile saklanır (internet gerekmez).

## Bu projede neler var / neler yok

**Var (çalışır durumda):**
- 🏠 Kiler yönetimi (manuel ürün ekleme)
- 🍳 Evdeki malzemeye göre tarif eşleştirme (%kaç malzeme mevcut)
- 🛒 Market listesi + eksik malzemeleri tek tıkla listeye ekleme
- 💰 Harcama kaydı + aylık toplam grafiği (kart bazlı)
- 💧 Su takibi
- 📊 Ana sayfa özeti

**Yok (Faz 2 — sonradan eklenmesi gerekir):**
- 📷 Barkod tarama (kamera plugin'i + Open Food Facts API entegrasyonu gerekir)
- Health Connect / otomatik adım takibi
- Gerçek kalori/besin veritabanı (şu an tarifler sabit kcal değeriyle geliyor)
- Bildirimler (yerel push notification plugin'i gerekir)

## APK'yi nasıl alırsın (GitHub Actions ile, bilgisayarına hiçbir şey kurmadan)

1. GitHub'da yeni, **boş** bir repo oluştur (README eklemeden).
2. Bu klasörün içeriğini o repoya push et:

   ```bash
   cd market-asistan
   git init
   git add .
   git commit -m "ilk surum"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
   git push -u origin main
   ```

3. GitHub'da reponun **Actions** sekmesine git. "Build APK" workflow'u otomatik başlayacak
   (birkaç dakika sürer — ilk seferde Android platformunu oluşturduğu için biraz uzun sürebilir).
4. Workflow bitince, o çalışmanın (run) sayfasının en altında **Artifacts** bölümünden
   `market-asistan-debug-apk` dosyasını indir. İçinden çıkan `app-debug.apk` dosyasını
   telefonuna atıp kurabilirsin (bilinmeyen kaynaklardan yükleme izni gerekebilir).

> Not: Bu debug APK'dir, test/kendi kullanımın için yeterlidir. Play Store'a yüklemek
> istersen ayrıca imzalı (signed) release APK/AAB üretmen gerekir — istersen onun için de
> workflow hazırlayabilirim.

## Yerelde (opsiyonel) Android Studio ile açmak istersen

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

## Dosya yapısı

```
www/          → uygulamanın kendisi (HTML/CSS/JS, tüm mantık burada)
  index.html
  style.css
  app.js
capacitor.config.json  → Capacitor ayarları
package.json
.github/workflows/build-apk.yml  → APK'yi otomatik derleyen GitHub Actions
```
