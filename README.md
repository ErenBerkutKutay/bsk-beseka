# Beseka Otomotiv Web Platformu

Next.js tabanlı otomotiv yedek parça katalog platformu. Scrolly telling ana sayfa, YTT benzeri katalog/OEM arama, admin panel ve B2B giriş içerir.

## Özellikler

- **Scrolly telling ana sayfa** — GSAP ScrollTrigger + Lenis smooth scroll
- **Katalog & OEM arama** — tire, boşluk, nokta fark etmeksizin kod eşleştirme
- **Yeni ürünler** — admin panelden işaretlenebilir
- **Admin panel** — ürün, OEM/cross kod, araç uyumluluk, blog, sayfa yönetimi
- **B2B giriş** — placeholder dashboard
- **Çok dilli** — TR, EN, DE, AR, ES, IT (next-intl)

## Medya (beseka.com)

Logo, hero slaytları, ürün görselleri ve blog kapakları [beseka.com](https://www.beseka.com) adresinden indirilip `public/beseka/` altına kaydedilmiştir. Güncellemek için:

```bash
# Görselleri yeniden indir (scripts/download-beseka-assets.sh)
bash scripts/download-beseka-assets.sh
npm run db:sync-beseka
```


```bash
# Bağımlılıklar
npm install

# PostgreSQL (Docker)
docker compose up -d

# .env dosyasını oluştur
cp .env.example .env

# Veritabanı migration ve seed
npm run db:migrate
npm run db:seed

# Geliştirme sunucusu
npm run dev
```

Site: http://localhost:8008/tr

## Admin Panel

| Adres | http://localhost:8008/tr/admin/giris |
|-------|--------------------------------------|
| E-posta | `admin@beseka.com` |
| Şifre | `admin123` |

Giriş yaptıktan sonra **Ürünler** bölümünden SKU, OEM kodları, görseller ve araç uyumluluğunu düzenleyebilirsiniz.

```bash
# Veritabanı ve admin hesabı yoksa:
npm run db:setup
```


## OEM Arama

Kodlar kayıt ve arama sırasında normalize edilir:

```
"12 34-56.78" → "12345678"
"12345678"    → eşleşir ✓
```

Admin panelde OEM kodları satır satır veya virgülle girilebilir.

## Araç Uyumluluk Import

CSV formatı (noktalı virgülle ayrılmış):

```
Renault;Clio;IV;2012;2019;1.5 dCi
Fiat;Egea;1.3 D;2015;2024;1.3 D
```

## Proje Yapısı

```
src/
├── app/[locale]/(public)/   # Ana site
├── app/[locale]/admin/      # Admin panel
├── app/api/                 # API routes
├── components/              # UI bileşenleri
├── lib/oem/normalize.ts     # OEM normalizasyon
└── messages/                # i18n çevirileri
```

## Cloudflare ile Canlıya Alma

Bu proje SSR + PostgreSQL kullandığı için **Cloudflare Workers (OpenNext)** ile dağıtılır. Pages Direct Upload (klasör yükleme) **kullanılmamalı** — 1000 dosya limitine takılır.

Detaylı adımlar: [DEPLOY-CLOUDFLARE.md](./DEPLOY-CLOUDFLARE.md)

Alternatif: [DEPLOY-FIREBASE.md](./DEPLOY-FIREBASE.md) (Firebase App Hosting)

```bash
firebase login
firebase apphosting:backends:create --project YOUR_PROJECT_ID
firebase apphosting:secrets:set DATABASE_URL
# GitHub main branch push → otomatik deploy
```
