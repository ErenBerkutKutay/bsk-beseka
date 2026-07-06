# Firebase ile Canlıya Alma (Beseka)

Bu proje **SSR Next.js + PostgreSQL + API** kullandığı için klasik (sadece statik) Firebase Hosting yeterli değildir. **Firebase App Hosting** kullanın.

## Ön koşullar

1. [Firebase projesi](https://console.firebase.google.com/)
2. [Firebase CLI](https://firebase.google.com/docs/cli): `npm i -g firebase-tools`
3. GitHub repo (App Hosting Git bağlantısı için)
4. **Bulut PostgreSQL** (local Docker çalışmaz):
   - [Neon](https://neon.tech) (önerilen, ücretsiz katman)
   - veya Supabase / Cloud SQL

## Firebase Web SDK (client)

Console'dan aldığınız web app config `src/lib/firebase.ts` içinde env değişkenleriyle kullanılır:

```ts
import { getFirebaseApp } from "@/lib/firebase";
```

Bu config **App Hosting deploy için zorunlu değildir**; ileride Storage, Analytics vb. için hazırdır.  
Site girişi **NextAuth** ile çalışır (Firebase Authentication değil).

`.env` / App Hosting ortamında `NEXT_PUBLIC_FIREBASE_*` değerleri tanımlı olmalı ( `apphosting.yaml` içinde mevcut).

## Firebase Admin SDK (sunucu)

Console'daki `require("firebase-admin")` + `serviceAccountKey.json` örneği yerine projede:

```ts
import { getFirebaseAdminApp } from "@/lib/firebase-admin";
```

**Yerel geliştirme:** Service account JSON indirin, repoya koymayın:

```bash
# Firebase Console → beseka-encom → Project settings → Service accounts → Generate new private key
export FIREBASE_SERVICE_ACCOUNT_JSON='$(cat ~/Downloads/beseka-encom-*.json)'
```

**App Hosting (canlı):** Çoğu durumda ekstra key gerekmez; Cloud Run otomatik kimlik bilgisi kullanır. Storage için IAM izinlerini kontrol edin.

`serviceAccountKey.json` dosyasını **asla Git'e eklemeyin**.

## 1. Veritabanını hazırlayın

Neon/Supabase'te yeni DB oluşturup connection string alın:

```
postgresql://USER:PASSWORD@HOST/bsk?sslmode=require
```

Yerelde bir kez şema + seed:

```bash
DATABASE_URL="postgresql://..." npm run db:push
DATABASE_URL="postgresql://..." npm run db:seed
```

## 2. Firebase App Hosting backend oluşturun

```bash
firebase login
firebase apphosting:backends:create --project YOUR_PROJECT_ID
```

Firebase Console → **Hosting & Serverless → App Hosting → Create backend**:

- **Root directory:** `/` (repo kökü)
- **Live branch:** `main`
- **Framework:** Next.js (otomatik algılanır)
- GitHub repo bağlayın

## 3. Secret / environment değişkenleri

`apphosting.yaml` içinde secret referansları tanımlı. CLI ile oluşturun:

```bash
firebase apphosting:secrets:set DATABASE_URL --project YOUR_PROJECT_ID
firebase apphosting:secrets:set AUTH_SECRET --project YOUR_PROJECT_ID
firebase apphosting:secrets:set AUTH_URL --project YOUR_PROJECT_ID
firebase apphosting:secrets:set NEXT_PUBLIC_SITE_URL --project YOUR_PROJECT_ID
```

| Değişken | Örnek (canlı) |
|----------|----------------|
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://beseka-xxxxx.web.app` veya custom domain |
| `NEXT_PUBLIC_SITE_URL` | Aynı canlı URL |

Secret oluşturduktan sonra backend'e erişim izni verin (CLI sorar).

Alternatif: Console → Backend → **Settings → Environment** → değişkenleri yapıştırın.

## 4. Deploy

GitHub `main` branch'e push → App Hosting otomatik rollout yapar.

Manuel rollout: Console → Backend → **Rollout**.

İlk deploy URL örneği: `https://BACKEND_ID--PROJECT_ID.web.app`

## 5. Custom domain (isteğe bağlı)

Console → App Hosting → Backend → **Domains** → `beseka.com` ekleyin.

DNS kayıtlarını Firebase'in verdiği şekilde güncelleyin. Sonra:

- `AUTH_URL` ve `NEXT_PUBLIC_SITE_URL` → `https://beseka.com` (veya `https://www.beseka.com`)

## Önemli notlar

### Klasik Hosting değil
`firebase deploy --only hosting` bu projeyi **çalıştırmaz**. App Hosting kullanın.

### `output: standalone`
`next.config.ts` içinde ayarlı — App Hosting / Cloud Run için gerekli.

### Admin upload (`public/uploads/`)
Cloud Run dosya sistemi geçicidir; yüklenen görseller restart sonrası kaybolabilir. Üretimde **Firebase Storage** veya Cloud Storage entegrasyonu planlayın.

### Build
`postinstall` → `prisma generate` otomatik çalışır. `DATABASE_URL` build ve runtime'da gerekir.

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Build DB hatası | `DATABASE_URL` secret'ı BUILD availability ile tanımlı mı kontrol edin |
| Giriş çalışmıyor | `AUTH_URL` canlı domain ile birebir eşleşmeli |
| 500 hatası | App Hosting → Logs; genelde DB bağlantısı veya eksik secret |
| Safari banner | Yerel CSS düzeltmeleri canlıda da geçerli |

## Yerel production testi

```bash
npm run build
node .next/standalone/server.js
# PORT=8080 DATABASE_URL=... AUTH_SECRET=... AUTH_URL=http://localhost:8080 ...
```
