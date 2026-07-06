# Cloudflare Workers ile Canlıya Alma (Beseka)

Bu proje **SSR Next.js + PostgreSQL + API** kullanır. Cloudflare **Pages Direct Upload** (sürükle-bırak) ile dağıtılamaz — `node_modules` ve `.next` binlerce dosya içerir ve **1000 dosya limitine** takılırsınız.

Doğru yol: **OpenNext + Wrangler CLI** veya **Git bağlantılı Workers deploy**.

## Ön koşullar

1. [Cloudflare hesabı](https://dash.cloudflare.com/)
2. **Workers Paid plan** (~$5/ay) — Bu proje Prisma 7 + NextAuth kullandığı için sıkıştırılmış bundle ~3,8 MiB; **ücretsiz planın 3 MiB limitini aşar**. Paid planda limit 10 MiB.
3. Wrangler (projede zaten var): `npx wrangler login`
3. **Bulut PostgreSQL** (local Docker canlıda çalışmaz):
   - [Neon](https://neon.tech) (önerilen)
   - veya Supabase
4. GitHub repo (isteğe bağlı, otomatik deploy için)

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

## 2. Yerelde önizleme (isteğe bağlı)

`.dev.vars.example` dosyasını `.dev.vars` olarak kopyalayın ve değerleri doldurun:

```bash
cp .dev.vars.example .dev.vars
npm run preview
```

Uygulama `http://localhost:8788` adresinde açılır.

## 3. Canlıya deploy (Wrangler CLI — önerilen)

Proje kökünde:

```bash
# İlk kez Cloudflare'e giriş
npx wrangler login

# Gizli ortam değişkenleri (her biri ayrı komut)
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
npx wrangler secret put AUTH_URL          # örn. https://beseka.sizin-domain.workers.dev
npx wrangler secret put NEXT_PUBLIC_SITE_URL

# Build + deploy
npm run deploy
```

Deploy sonrası URL: Cloudflare dashboard → Workers → `bsk` worker.

### Direct Upload kullanmayın

| Yöntem | Sonuç |
|--------|--------|
| Pages → Direct Upload (klasör seç) | ❌ 1000+ dosya hatası |
| `npm run deploy` (Wrangler) | ✅ Doğru |
| Git → Workers build | ✅ Doğru |

## 4. Git ile otomatik deploy (alternatif)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Connect to Git**
2. Repo'yu seçin
3. Build ayarları:
   - **Build command:** `npm run deploy` veya `npx opennextjs-cloudflare build`
   - **Deploy command:** `npx opennextjs-cloudflare deploy`
4. Ortam değişkenlerini dashboard'dan **Settings → Variables and Secrets** altına ekleyin

## 5. Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Neon/Supabase connection string |
| `AUTH_SECRET` | En az 32 karakter rastgele secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Canlı site URL'si (trailing slash yok) |
| `NEXT_PUBLIC_SITE_URL` | Aynı canlı URL |

## 6. PostgreSQL performansı (Hyperdrive — önerilir)

Workers üzerinde doğrudan `pg` bağlantısı çalışır; bağlantı havuzu için [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) kullanmanız önerilir:

```bash
npx wrangler hyperdrive create bsk-db --connection-string="postgresql://..."
```

`wrangler.jsonc` içine ekleyin:

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "<hyperdrive-id>"
  }
]
```

Ardından `src/lib/db.ts` içinde `DATABASE_URL` yerine Hyperdrive connection string kullanılması gerekir (Cloudflare runtime'da `env.HYPERDRIVE.connectionString`).

## 7. Önbellek (R2 — isteğe bağlı)

Migrate sırasında R2 bucket oluşturulamadıysa önbellek devre dışıdır; site yine çalışır. R2 eklemek için:

```bash
npx wrangler r2 bucket create bsk-opennext-cache
```

Sonra `wrangler.jsonc` ve `open-next.config.ts` dosyalarındaki yorum satırlarını açın. Detay: [OpenNext Cloudflare caching](https://opennext.js.org/cloudflare/caching).

## 8. Admin görsel yüklemeleri

`public/uploads/` klasörü Workers'ta **kalıcı değildir** — her deploy'da sıfırlanır. Üretimde görseller için **Cloudflare R2** veya harici depolama (S3, Cloudinary) kullanın.

## 9. Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| 1000 dosya upload limiti | Direct Upload kullanmayın; `npm run deploy` |
| Worker size limit (3 MiB) | [Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans) planına geçin, sonra `npm run deploy` |
| `pg-cloudflare` build hatası | `next.config.ts` içindeki `outputFileTracingIncludes` zaten eklendi |
| Prisma / DB hatası | `DATABASE_URL` secret'ını kontrol edin; Neon'da `sslmode=require` |
| Middleware / auth çalışmıyor | `AUTH_URL` ve `AUTH_SECRET` canlı URL ile eşleşmeli |

## Komut özeti

```bash
npm run dev       # Yerel geliştirme (port 8008)
npm run preview   # Cloudflare Workers önizleme (port 8788)
npm run deploy    # Canlıya al
npm run upload    # Sadece worker yükle (build sonrası)
```
