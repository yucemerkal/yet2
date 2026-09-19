# DijitalKalkan — Android MVP (GitHub Actions ile APK derleme)

Bu proje, telefondan Android Studio kurmadan, **GitHub üzerinden APK derlemen**
için hazırlanmıştır.

## Bu MVP'de neler var?

- Ebeveyn Modu: takip edilecek uygulamalara günlük dakika limiti belirleme,
  uyku modu saat aralığı belirleme
- Çocuk Modu: bugünkü uygulama kullanımını (YouTube, TikTok, Instagram, Chrome)
  görüntüleme
- Arka planda 15 dakikada bir çalışan otomatik kontrol: limit yaklaşınca/
  dolunca bildirim gönderir

## Önemli sınırlama (dürüstçe belirtiyorum)

Bu sürüm **tek cihazda** çalışır — ebeveyn ve çocuk aynı telefonda "Ebeveyn
Modu" ve "Çocuk Modu" arasında geçiş yapar. Gerçek anlamda ebeveynin kendi
telefonundan **çocuğun ayrı bir cihazını** uzaktan yönetmesi için bir backend
(örn. Firebase Firestore + Authentication) gerekir. Bunun kurulumu senin kendi
Firebase hesabına bağlı `google-services.json` dosyası gerektirdiğinden burada
otomatik eklenemedi. Proje yapısı buna kolayca genişletilebilir (bkz. aşağıda
"Sıradaki adım").

Ayrıca Android, `PACKAGE_USAGE_STATS` iznini kod ile otomatik veremez —
kullanıcı Ayarlar > Özel erişim > Kullanım verilerine erişim ekranından elle
izin vermelidir. Uygulama bu ekranı otomatik açan bir buton içeriyor.

## APK'yı nasıl alırım?

1. GitHub'da yeni bir repo oluştur (örn. `dijitalkalkan`).
2. Bu klasördeki tüm dosyaları o repoya yükle (push et).
3. GitHub reposunda **Actions** sekmesine git.
4. "Build APK" workflow'unun otomatik çalıştığını göreceksin (her `main`
   dalına push'ta tetiklenir). Çalışması bitince açıp altında
   **Artifacts** bölümünden `DijitalKalkan-debug-apk` dosyasını indir.
5. İndirdiğin `.zip` içinden `app-debug.apk` dosyasını telefonuna at ve kur
   (telefonda "bilinmeyen kaynaklardan yükleme" iznini açman gerekebilir).

İlk çalıştırmayı elle tetiklemek istersen: Actions sekmesi → "Build APK" →
"Run workflow" butonunu kullanabilirsin (workflow'a `workflow_dispatch`
eklendi, bu yüzden manuel de tetiklenebilir).

## Git komutlarıyla push (terminal kullanıyorsan)

```bash
cd DijitalKalkan
git init
git add .
git commit -m "İlk MVP"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/dijitalkalkan.git
git push -u origin main
```

GitHub mobil uygulaması veya web arayüzü üzerinden dosya yükleyerek de (drag
& drop) aynı işlemi terminale hiç dokunmadan yapabilirsin.

## Sıradaki adım (V2): gerçek çok cihazlı senkronizasyon

1. [Firebase Console](https://console.firebase.google.com) üzerinden ücretsiz
   bir proje oluştur.
2. Android app ekle, paket adı olarak `com.dijitalkalkan.app` gir.
3. İndirdiğin `google-services.json` dosyasını `app/` klasörüne koy.
4. `app/build.gradle` içine `com.google.gms.google-services` eklentisini ve
   Firestore/Authentication bağımlılıklarını ekle.
5. `PrefsManager` sınıfındaki yerel okuma/yazma işlemlerini Firestore
   koleksiyonlarıyla değiştir (örn. `families/{familyId}/children/{childId}/limits`).

Bu adıma geldiğinde bana tekrar yazabilirsin, Firebase entegrasyonunu ve
ebeveyn-çocuk eşleştirme ekranlarını birlikte ekleriz.
