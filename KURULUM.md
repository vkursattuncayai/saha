# SahaBul — Kurulum Rehberi

Bu rehber, SahaBul uygulamasını sıfırdan kendi bilgisayarında çalıştırmak ya da Vercel'e deploy etmek için gereken tüm adımları anlatır. Her adım tek tek açıklanmıştır.

---

## İçindekiler

1. [Ne Lazım?](#1-ne-lazım)
2. [Dosyaları Bilgisayara Al](#2-dosyaları-bilgisayara-al)
3. [Supabase Kurulumu (Veritabanı)](#3-supabase-kurulumu-veritabanı)
4. [Ortam Değişkenlerini Ayarla (.env)](#4-ortam-değişkenlerini-ayarla-env)
5. [Paketleri Yükle](#5-paketleri-yükle)
6. [Veritabanı Tablolarını Oluştur](#6-veritabanı-tablolarını-oluştur)
7. [Test Verilerini Yükle (Seed)](#7-test-verilerini-yükle-seed)
8. [Uygulamayı Çalıştır](#8-uygulamayı-çalıştır)
9. [Vercel'e Deploy Et (İnternet'e Al)](#9-vercele-deploy-et-internete-al)
10. [Test Hesapları](#10-test-hesapları)
11. [Sık Sorulan Sorular & Hatalar](#11-sık-sorulan-sorular--hatalar)

---

## 1. Ne Lazım?

Başlamadan önce bunların bilgisayarında kurulu olması gerekiyor:

### Node.js
JavaScript kodunu çalıştıran program. Yoksa kur:
- https://nodejs.org adresine git
- "LTS" yazan butona tıkla (şu an v20 veya daha yeni)
- İndir ve kur
- Kuruldu mu kontrol et: terminali aç ve yaz: `node --version`
- Ekranda `v20.x.x` gibi bir şey çıkması gerekiyor

### Git
Kod kopyalamak için gerekli:
- https://git-scm.com adresine git
- İndir ve kur
- Kuruldu mu kontrol et: `git --version`

### Bir Terminal (Komut Satırı)
- **Mac:** Launchpad'den "Terminal" aç
- **Windows:** Başlat menüsünden "cmd" veya "PowerShell" aç

### Supabase Hesabı (Ücretsiz)
- https://supabase.com adresine git
- "Start your project" ile ücretsiz hesap aç
- Gmail ile giriş yapabilirsin

### Vercel Hesabı (Ücretsiz, sadece deploy için)
- https://vercel.com adresine git
- "Sign Up" ile ücretsiz hesap aç
- GitHub ile giriş yapabilirsin

---

## 2. Dosyaları Bilgisayara Al

Terminal aç ve şu komutları sırayla yaz:

```bash
# Proje dosyalarını indir
git clone https://github.com/vkursattuncayai/saha.git

# Proje klasörüne gir
cd saha
```

Eğer `git clone` çalışmazsa, GitHub sayfasına git → yeşil "Code" butonu → "Download ZIP" ile indir ve zip'i aç.

---

## 3. Supabase Kurulumu (Veritabanı)

### Adım 3.1 — Yeni Proje Oluştur
1. https://app.supabase.com adresine git ve giriş yap
2. "New project" butonuna tıkla
3. İsim ver: `sahabul` (istediğin ismi verebilirsin)
4. Şifre belirle — güçlü bir şifre seç ve bir yere yaz (lazım olacak)
5. Bölge seç: "West EU (Ireland)" veya en yakın bölge
6. "Create new project" butonuna tıkla
7. Proje oluşturulurken 1-2 dakika bekle (ekranda yeşil ışık yanacak)

### Adım 3.2 — API Anahtarlarını Al
1. Sol menüden **Settings** (⚙️ simgesi) tıkla
2. **API** sekmesine tıkla
3. Şu iki şeyi kopyala ve bir yere kaydet:
   - **Project URL** → `https://xxxxx.supabase.co` şeklinde bir adres
   - **service_role** anahtarı → `eyJ...` ile başlayan uzun bir metin (bu gizlidir, kimseyle paylaşma!)

> Not: `anon` anahtarı değil, `service_role` anahtarı lazım. Sayfada ikisi de var, doğru olanı al.

---

## 4. Ortam Değişkenlerini Ayarla (.env)

Proje klasöründe `.env` adında bir dosya oluşturacaksın. Bu dosya gizli bilgileri tutar.

Terminal'de proje klasöründeyken:

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```cmd
copy .env.example .env
```

Eğer `.env.example` yoksa, bir metin editörü ile (Notepad, VS Code, vs.) `.env` dosyasını oluştur ve içine şunu yaz:

```
SUPABASE_URL=https://SENIN-PROJE-ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...uzun-anahtar...
JWT_SECRET=supergizlibiranahtar123456
JWT_EXPIRES_IN=7d
PORT=3000
```

**Değerleri nasıl dolduracaksın:**
- `SUPABASE_URL` → Adım 3.2'de kopyaladığın Project URL
- `SUPABASE_SERVICE_ROLE_KEY` → Adım 3.2'de kopyaladığın service_role anahtarı
- `JWT_SECRET` → Rastgele bir şeyler yaz (örn: `sahabul2024gizlianahtar`)
- `JWT_EXPIRES_IN` → `7d` olarak bırak (7 gün geçerli)
- `PORT` → `3000` olarak bırak

---

## 5. Paketleri Yükle

Terminal'de proje klasöründeyken:

```bash
npm install
```

Bu komut, projenin ihtiyaç duyduğu tüm kütüphaneleri indirir. İnternet bağlantısına göre 1-3 dakika sürebilir. Ekranda çok şey yazılacak — bu normal.

---

## 6. Veritabanı Tablolarını Oluştur

Supabase'de tablolar oluşturman lazım.

### Adım 6.1 — SQL Editor'ü Aç
1. https://app.supabase.com adresine git
2. Projen tıkla
3. Sol menüden **SQL Editor** (veritabanı simgesi) tıkla

### Adım 6.2 — Schema SQL'ini Çalıştır
1. `backend/supabase-schema.sql` dosyasını bir metin editörüyle aç
2. Tüm içeriği kopyala (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor'e yapıştır
4. Sağ üstteki **Run** butonuna tıkla (ya da Ctrl+Enter)
5. Alt tarafta "Success. No rows returned" çıkması gerekiyor

Bu adım şu tabloları oluşturur: `users`, `fields`, `time_slots`, `reservations`, `payments`, `favorites`, `reviews`

---

## 7. Test Verilerini Yükle (Seed)

Seed komutu, veritabanına örnek sahalar ve zaman slotları ekler.

Terminal'de proje klasöründeyken:

```bash
node backend/seed/seed.js
```

Başarılı olunca terminalde şunu göreceksin:
```
✅ 15 saha eklendi
✅ 7980 zaman slotu oluşturuldu
🎉 Seed tamamlandı!
```

> Eğer hata alırsan: `.env` dosyasını kontrol et. Supabase URL ve anahtar doğru mu?

---

## 8. Uygulamayı Çalıştır

```bash
node backend/server.js
```

Terminalde şunu göreceksin:
```
🚀 Server çalışıyor: http://localhost:3000
```

Tarayıcını aç ve git: **http://localhost:3000**

SahaBul ana sayfası açılması gerekiyor!

Durdurmak için terminalde **Ctrl+C** bas.

---

## 9. Vercel'e Deploy Et (İnternet'e Al)

### Adım 9.1 — Kodu GitHub'a Gönder
1. GitHub'da yeni bir repo oluştur: https://github.com/new
2. Terminal'de:

```bash
git init
git add .
git commit -m "İlk commit"
git remote add origin https://github.com/KULLANICI-ADIN/REPO-ADIN.git
git push -u origin main
```

### Adım 9.2 — Vercel'e Bağla
1. https://vercel.com adresine git ve giriş yap
2. "Add New → Project" tıkla
3. GitHub'daki repoyu seç
4. "Import" tıkla
5. Ayarları değiştirme — olduğu gibi "Deploy" tıkla

### Adım 9.3 — Ortam Değişkenlerini Vercel'e Ekle
Deploy tamamlandıktan sonra:
1. Vercel'de projenin sayfasına git
2. **Settings → Environment Variables** sekmesi
3. Şu değişkenleri tek tek ekle:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Supabase proje URL'in |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role anahtarın |
| `JWT_SECRET` | .env'deki aynı değer |
| `JWT_EXPIRES_IN` | `7d` |

4. Her birini ekledikten sonra **Save** tıkla
5. **Deployments** sekmesine git → son deployment'ın yanındaki `...` → **Redeploy**

Birkaç dakika sonra uygulamanın `https://PROJE-ADIN.vercel.app` adresinden erişilebilir olması gerekiyor.

---

## 10. Test Hesapları

Seed çalıştırıldıktan sonra bu hesaplarla giriş yapabilirsin:

### Admin Hesabı
- **E-posta:** `admin@sahabul.com`
- **Şifre:** `admin123`
- Giriş yapınca direkt Admin Paneline yönlendirir

### Normal Kullanıcı (Hazır Hesap Yok)
- Ana sayfada "Kayıt Ol" butonuyla yeni hesap oluştur
- Herhangi bir e-posta ve şifre kullanabilirsin

---

## 11. Sık Sorulan Sorular & Hatalar

### "Cannot find module" hatası
**Sebep:** `npm install` çalıştırılmamış.
**Çözüm:**
```bash
npm install
```

---

### "SUPABASE_URL is not defined" veya server başlamıyor
**Sebep:** `.env` dosyası yok veya eksik.
**Çözüm:** Adım 4'ü tekrar kontrol et. `.env` dosyasının proje ana klasöründe (server.js ile aynı seviyede değil, en üstte) olması gerekiyor.

---

### "Port 3000 already in use" hatası
**Sebep:** Başka bir program 3000 portunu kullanıyor.
**Çözüm (Mac/Linux):**
```bash
lsof -ti:3000 | xargs kill -9
```
**Çözüm (Windows):**
```cmd
netstat -ano | findstr :3000
taskkill /PID <çıkan-sayı> /F
```

---

### Vercel'de "500 Internal Server Error"
**Sebep:** Ortam değişkenleri eksik.
**Çözüm:** Adım 9.3'ü tekrar kontrol et. Vercel'de 4 değişkenin de eklendiğinden emin ol. Eklendikten sonra yeniden deploy et.

---

### Seed çalışmıyor, hata veriyor
**Sebep:** Genellikle SQL tabloları oluşturulmamış ya da bağlantı hatası.
**Çözüm:**
1. Adım 6'yı yaptın mı? SQL Editor'de schema.sql çalıştırdın mı?
2. `.env` dosyasındaki SUPABASE_URL ve KEY doğru mu?
3. Supabase projen aktif mi? (Supabase ücretsiz projeleri 1 hafta kullanılmazsa uyku moduna girer — açmak için https://app.supabase.com'dan projeye tıkla)

---

### Giriş yapıyorum ama "Unauthorized" diyor
**Sebep:** JWT_SECRET `.env`'de tanımlanmamış ya da değiştirilmiş.
**Çözüm:** `.env` dosyasında `JWT_SECRET` değerinin olduğunu kontrol et. Değiştirdiysen tüm kullanıcıların yeniden giriş yapması gerekir.

---

### Saha resimleri yüklenmiyor
Bu normal — resimler Unsplash'tan geliyor. İnternet bağlantın varsa yüklenmesi gerekiyor. Çok yavaşsa veya hata alıyorsan internet bağlantını kontrol et.

---

### Supabase projemi uyku modundan nasıl çıkarırım?
1. https://app.supabase.com adresine git
2. Projenin üzerine tıkla
3. "Restore project" veya benzer bir butona tıkla
4. 1-2 dakika bekle

---

## Proje Yapısı (Kısaca)

```
stitch/
├── ana_sayfa/          → Ana sayfa (HTML + JS)
├── saha_listeleme/     → Saha arama/filtreleme
├── saha_detay/         → Saha detay sayfası
├── rezervasyon/        → Ödeme ve rezervasyon
├── kullan_c_paneli/    → Kullanıcı paneli
├── admin_paneli/       → Admin paneli
├── frontend/
│   └── shared/
│       └── js/         → Tüm sayfalarda kullanılan JS (api.js, auth.js, ui.js, router.js)
├── backend/
│   ├── server.js       → Ana sunucu dosyası
│   ├── database.js     → Supabase bağlantısı
│   ├── routes/         → API endpoint'leri
│   ├── controllers/    → İş mantığı
│   ├── middleware/     → Auth kontrolü
│   ├── seed/           → Test verisi
│   └── supabase-schema.sql → Veritabanı şeması
├── .env                → Gizli bilgiler (git'e commit etme!)
├── vercel.json         → Vercel ayarları
└── package.json        → Node.js bağımlılıkları
```

---

Herhangi bir sorun yaşarsan GitHub Issues'a yazabilirsin.
