import "dotenv/config";
import { PRODUCT_GROUPS } from "../src/lib/categories/product-groups";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { buildOEMEntries } from "../src/lib/oem/normalize";
import { syncVehicleCatalog } from "../src/lib/vehicles/sync-vehicle-catalog";
import { fallbackHomeIntro } from "../src/lib/beseka/home-intro";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

type ProductSeed = {
  sku: string;
  slug: string;
  categorySlug: string;
  name: { tr: string };
  description: { tr: string };
  image: string;
  isNew: boolean;
  oemCodes: string[];
  crossCodes: string[];
  fitments: {
    make: string;
    model: string;
    subModel?: string | null;
    yearFrom?: number | null;
    yearTo?: number | null;
    engine?: string | null;
  }[];
};

async function upsertProduct(item: ProductSeed) {
  const category = await db.category.findUnique({ where: { slug: item.categorySlug } });
  if (!category) throw new Error(`Category not found: ${item.categorySlug}`);

  const existing = await db.product.findUnique({ where: { sku: item.sku } });

  if (existing) {
    await db.oEMCode.deleteMany({ where: { productId: existing.id } });
    await db.crossCode.deleteMany({ where: { productId: existing.id } });

    return db.product.update({
      where: { id: existing.id },
      data: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        categoryId: category.id,
        images: [item.image],
        isNew: item.isNew,
        isFeatured: item.isNew,
        oemCodes: { create: buildOEMEntries(item.oemCodes) },
        crossCodes: { create: buildOEMEntries(item.crossCodes) },
      },
    });
  }

  return db.product.create({
    data: {
      sku: item.sku,
      slug: item.slug,
      name: item.name,
      description: item.description,
      categoryId: category.id,
      images: [item.image],
      isNew: item.isNew,
      isFeatured: item.isNew,
      oemCodes: { create: buildOEMEntries(item.oemCodes) },
      crossCodes: { create: buildOEMEntries(item.crossCodes) },
      fitments: { create: item.fitments },
    },
  });
}

async function main() {
  await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  const adminPassword = await bcrypt.hash("admin123", 10);
  const b2bPassword = await bcrypt.hash("b2b123", 10);

  await db.user.upsert({
    where: { email: "admin@beseka.com" },
    update: {},
    create: {
      email: "admin@beseka.com",
      passwordHash: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  await db.user.upsert({
    where: { email: "b2b@beseka.com" },
    update: {},
    create: {
      email: "b2b@beseka.com",
      passwordHash: b2bPassword,
      name: "B2B Kullanıcı",
      company: "Demo Bayi",
      role: "B2B",
    },
  });

  for (const [index, cat] of PRODUCT_GROUPS.entries()) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: index, isActive: true },
      create: { ...cat, sortOrder: index, isActive: true },
    });
  }

  const products: ProductSeed[] = [
    {
      sku: "B2306",
      slug: "b2306-suspansiyon-ara-yatak-takozu-arka-q14",
      categorySlug: "suspansiyon-takozlari",
      name: { tr: "B2306 | Süspansiyon Ara Yatak Takozu Arka Q14 (Peugeot Boxer, Citroen Jumper, Fiat Ducato)" },
      description: { tr: "Süspansiyon ara yatak takozu arka. Peugeot Boxer, Citroen Jumper, Fiat Ducato uyumlu." },
      image: "/beseka/products/b2306.jpg",
      isNew: true,
      oemCodes: ["1311826080", "1311 826 080", "46751547", "46 751 547"],
      crossCodes: [],
      fitments: [{ make: "Peugeot", model: "Boxer", subModel: null, yearFrom: 2006, yearTo: 2024, engine: null }],
    },
    {
      sku: "B2307",
      slug: "b2307-suspansiyon-ara-yatak-takozu-arka-q18",
      categorySlug: "suspansiyon-takozlari",
      name: { tr: "B2307 | Süspansiyon Ara Yatak Takozu Arka Q18-16 Jant (Peugeot Boxer, Citroen Jumper, Fiat Ducato)" },
      description: { tr: "Süspansiyon ara yatak takozu arka Q18-16 jant." },
      image: "/beseka/products/b2307.jpg",
      isNew: true,
      oemCodes: ["1311858080", "1311 858 080"],
      crossCodes: [],
      fitments: [{ make: "Fiat", model: "Ducato", subModel: null, yearFrom: 2006, yearTo: 2024, engine: null }],
    },
    {
      sku: "B6850",
      slug: "b6850-amortisor-toz-korugu-fiat-egea",
      categorySlug: "korukler",
      name: { tr: "B6850 | Amortisör Toz Körüğü (Fiat Egea 1.3 D Multijet, 1.4, 1.6)" },
      description: { tr: "Fiat Egea için amortisör toz körüğü." },
      image: "/beseka/products/b6850.jpg",
      isNew: true,
      oemCodes: ["51772753", "51 77 275 3", "51772-753"],
      crossCodes: [],
      fitments: [{ make: "Fiat", model: "Egea", subModel: "1.3 D", yearFrom: 2015, yearTo: 2024, engine: "1.3 D Multijet" }],
    },
    {
      sku: "B6657",
      slug: "b6657-amortisor-toz-korugu-fiat-dogan",
      categorySlug: "korukler",
      name: { tr: "B6657 | Amortisör Toz Körüğü (Fiat Doğan, Fiat Kartal, Fiat Şahin)" },
      description: { tr: "Klasik Fiat modelleri için amortisör toz körüğü." },
      image: "/beseka/products/b6657.jpg",
      isNew: true,
      oemCodes: ["4420024", "4420 024"],
      crossCodes: [],
      fitments: [{ make: "Fiat", model: "Doğan", subModel: null, yearFrom: 1988, yearTo: 2002, engine: null }],
    },
    {
      sku: "B6190",
      slug: "b6190-amortisor-toz-korugu-on-fiat-uno",
      categorySlug: "korukler",
      name: { tr: "B6190 | Amortisör Toz Körüğü Ön (Fiat Uno, Fiat Regata, Fiat Ritmo)" },
      description: { tr: "Fiat Uno, Regata, Ritmo ön amortisör toz körüğü." },
      image: "/beseka/products/b6190.jpg",
      isNew: true,
      oemCodes: ["5978771", "5978 771"],
      crossCodes: [],
      fitments: [{ make: "Fiat", model: "Uno", subModel: null, yearFrom: 1983, yearTo: 2002, engine: null }],
    },
    {
      sku: "B8359",
      slug: "b8359-amortisor-toz-korugu-renault-clio",
      categorySlug: "korukler",
      name: { tr: "B8359 | Amortisör Toz Körüğü (Renault Clio III, Modus)" },
      description: { tr: "Renault Clio III ve Modus uyumlu amortisör toz körüğü." },
      image: "/beseka/products/b8359.jpg",
      isNew: true,
      oemCodes: ["8200127285", "82 00 127 285", "Y4452", "4452"],
      crossCodes: [],
      fitments: [{ make: "Renault", model: "Clio", subModel: "III", yearFrom: 2005, yearTo: 2012, engine: null }],
    },
    {
      sku: "B8550",
      slug: "b8550-amortisor-toz-korugu-renault-megane",
      categorySlug: "korukler",
      name: { tr: "B8550 | Amortisör Toz Körüğü Sağ Sol (Renault Megane II, Scenic II)" },
      description: { tr: "Renault Megane II ve Scenic II uyumlu." },
      image: "/beseka/products/b8550.jpg",
      isNew: true,
      oemCodes: ["8200040073", "82 00 040 073", "Y4284", "2557000542824"],
      crossCodes: [],
      fitments: [{ make: "Renault", model: "Megane", subModel: "II", yearFrom: 2002, yearTo: 2009, engine: null }],
    },
    {
      sku: "B8650",
      slug: "b8650-amortisor-toz-korugu-renault-fluence",
      categorySlug: "korukler",
      name: { tr: "B8650 | Amortisör Toz Körüğü (Renault Fluence, Megane III)" },
      description: { tr: "Renault Fluence ve Megane III uyumlu." },
      image: "/beseka/products/b8650.jpg",
      isNew: true,
      oemCodes: ["540500006R", "540505143R", "540500016R", "2557000495701"],
      crossCodes: [],
      fitments: [{ make: "Renault", model: "Fluence", subModel: null, yearFrom: 2009, yearTo: 2016, engine: null }],
    },
    {
      sku: "B8306.T",
      slug: "b8306t-amortisor-takozu-ve-rulmani-kit",
      categorySlug: "amortisor-takozlari",
      name: { tr: "B8306.T | Amortisör Takozu Ve Rulmanı Kit (Renault Captur I, Clio IV, Clio III)" },
      description: { tr: "Amortisör takozu ve rulman kiti." },
      image: "/beseka/products/b8306t.jpg",
      isNew: true,
      oemCodes: [],
      crossCodes: [],
      fitments: [{ make: "Renault", model: "Clio", subModel: "IV", yearFrom: 2012, yearTo: 2019, engine: null }],
    },
    {
      sku: "B8376",
      slug: "b8376-motor-takozu-sag-renault-clio-v",
      categorySlug: "motor-sanziman-takozlari",
      name: { tr: "B8376 | Motor Takozu Sağ 1.0 Tce H4d Orijinal (Renault Clio V)" },
      description: { tr: "Renault Clio V 1.0 Tce motor takozu sağ." },
      image: "/beseka/products/b8376.jpg",
      isNew: true,
      oemCodes: ["112323904R", "112323904 R", "11 23 239 04R"],
      crossCodes: [],
      fitments: [{ make: "Renault", model: "Clio", subModel: "V", yearFrom: 2019, yearTo: 2024, engine: "1.0 Tce" }],
    },
  ];

  for (const item of products) {
    await upsertProduct(item);
  }

  const makes = [
    {
      name: "Fiat",
      models: [
        { name: "Egea", subModels: ["1.3 D", "1.6 Multijet"] },
        { name: "Doblo", subModels: [] },
      ],
    },
    {
      name: "Renault",
      models: [
        { name: "Clio", subModels: ["III", "IV", "V"] },
        { name: "Fluence", subModels: [] },
        { name: "Megane", subModels: ["II", "III"] },
      ],
    },
    {
      name: "Peugeot",
      models: [{ name: "Boxer", subModels: [] }],
    },
    {
      name: "Citroen",
      models: [{ name: "Jumper", subModels: [] }],
    },
    {
      name: "Volkswagen",
      models: [{ name: "Golf", subModels: ["VII", "VIII"] }],
    },
  ];

  for (const [index, make] of makes.entries()) {
    const createdMake = await db.vehicleMake.upsert({
      where: { name: make.name },
      update: { sortOrder: index },
      create: { name: make.name, sortOrder: index },
    });

    for (const model of make.models) {
      const createdModel = await db.vehicleModel.upsert({
        where: { makeId_name: { makeId: createdMake.id, name: model.name } },
        update: {},
        create: { makeId: createdMake.id, name: model.name },
      });

      for (const sub of model.subModels) {
        await db.vehicleSubModel.upsert({
          where: { modelId_name: { modelId: createdModel.id, name: sub } },
          update: {},
          create: { modelId: createdModel.id, name: sub },
        });
      }
    }
  }

  const pages = [
    {
      slug: "kurumsal-hakkimizda",
      type: "CORPORATE" as const,
      title: { tr: "Hakkımızda" },
      content: {
        tr: "Beseka Otomotiv, otomotiv yedek parça sektöründe uzun yıllara dayanan deneyimiyle faaliyet göstermektedir.\n\nGüçlü mühendislik altyapımız ve hassas üretim süreçlerimizle maksimum uyum ve performans sunuyoruz.",
      },
    },
    {
      slug: "kurumsal-kultur",
      type: "CORPORATE" as const,
      title: { tr: "Kurumsal Kültürümüz" },
      content: { tr: "Genç, dinamik ve yenilikçi ekibimizle sürekli gelişim odaklı bir kültür benimsiyoruz." },
    },
    {
      slug: "kurumsal-vizyon-misyon",
      type: "CORPORATE" as const,
      title: { tr: "Vizyonumuz & Misyonumuz" },
      content: {
        tr: "Vizyon: Global otomotiv yedek parça pazarında tercih edilen marka olmak.\nMisyon: Kaliteli, güvenilir ve yenilikçi ürünler üretmek.",
      },
    },
    {
      slug: "kurumsal-degerler",
      type: "CORPORATE" as const,
      title: { tr: "Değerlerimiz" },
      content: { tr: "Kalite, güven, sürdürülebilirlik ve müşteri memnuniyeti temel değerlerimizdir." },
    },
    {
      slug: "kurumsal-surdurulebilirlik",
      type: "CORPORATE" as const,
      title: { tr: "Sürdürülebilirlik" },
      content: { tr: "Çevreye duyarlı üretim süreçleri ve kaynak verimliliği önceliğimizdir." },
    },
    {
      slug: "kurumsal-kvkk",
      type: "LEGAL" as const,
      title: { tr: "KVKK Aydınlatma Metni" },
      content: { tr: "Kişisel verilerin korunması hakkında aydınlatma metni." },
    },
    {
      slug: "uretim-kaynak",
      type: "PRODUCTION" as const,
      title: { tr: "Kaynak" },
      content: { tr: "Modern kaynak hatlarımızla yüksek mukavemetli birleşimler sağlıyoruz." },
    },
    {
      slug: "uretim-kaliphane",
      type: "PRODUCTION" as const,
      title: { tr: "Kalıphane" },
      content: { tr: "CAD/CAM destekli kalıphane departmanımız hızlı prototipleme imkânı sunar." },
    },
    {
      slug: "uretim-cnc",
      type: "PRODUCTION" as const,
      title: { tr: "CNC İşleme" },
      content: { tr: "Hassas CNC tezgahlarımızla mikron düzeyinde toleranslar elde ediyoruz." },
    },
    {
      slug: "uretim-vulkanizasyon",
      type: "PRODUCTION" as const,
      title: { tr: "Vulkanizasyon" },
      content: { tr: "Kauçuk-metal birleşimlerinde uzman vulkanizasyon süreçleri." },
    },
    {
      slug: "uretim-montaj",
      type: "PRODUCTION" as const,
      title: { tr: "Montaj" },
      content: { tr: "Son kontrol ve montaj hatlarımızda kalite güvence testleri uygulanır." },
    },
    {
      slug: "uretim-sac-sekillendirme",
      type: "PRODUCTION" as const,
      title: { tr: "Saç Parça Şekillendirme" },
      content: { tr: "Sac metal şekillendirme ve pres işlemleri." },
    },
    {
      slug: "uretim-aluminyum-enjeksiyon",
      type: "PRODUCTION" as const,
      title: { tr: "Alüminyum Enjeksiyon Baskı" },
      content: { tr: "Alüminyum enjeksiyon baskı ile yüksek hassasiyetli parça üretimi." },
    },
    {
      slug: "uretim-plastik-enjeksiyon",
      type: "PRODUCTION" as const,
      title: { tr: "Plastik Enjeksiyon" },
      content: { tr: "Plastik enjeksiyon hatlarımızda seri üretim kapasitesi." },
    },
    {
      slug: "uretim-markalama",
      type: "PRODUCTION" as const,
      title: { tr: "Markalama" },
      content: { tr: "Lazer ve etiket markalama çözümleri." },
    },
    {
      slug: "arge-arge-surecleri",
      type: "RD" as const,
      title: { tr: "AR-GE Süreçleri" },
      content: { tr: "Yeni ürün geliştirme ve mevcut ürün iyileştirme çalışmaları." },
    },
    {
      slug: "arge-muhendislik",
      type: "RD" as const,
      title: { tr: "Mühendislik" },
      content: { tr: "Tersine mühendislik ve OEM uyumluluk analizleri." },
    },
    {
      slug: "arge-kalite-kontrol",
      type: "RD" as const,
      title: { tr: "Kalite Kontrol" },
      content: { tr: "Laboratuvar testleri ve saha validasyon süreçleri." },
    },
    {
      slug: "iletisim-bilgiler",
      type: "CONTACT" as const,
      title: { tr: "İletişim Bilgileri" },
      content: {
        tr: "<p><strong>Telefon:</strong> +90 (224) 482 44 55</p><p><strong>E-posta:</strong> info@beseka.com</p><p>Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri</p>",
      },
    },
    {
      slug: "iletisim-mesaj",
      type: "CONTACT" as const,
      title: { tr: "Mesaj Gönder" },
      content: {
        tr: "Sorularınız, teklif talepleriniz ve iş birliği önerileriniz için formu doldurarak bize ulaşabilirsiniz. En kısa sürede size dönüş yapacağız.",
      },
    },
    {
      slug: "iletisim-nasil-gidilir",
      type: "CONTACT" as const,
      title: { tr: "Beseka'ya Nasıl Gidilir" },
      content: {
        tr: "<p>Beseka Otomotiv üretim tesislerimiz Bursa'dadır. Karayolu ile Bursa yönünden gelirken navigasyon uygulamanızda \"Beseka Otomotiv\" araması yapabilirsiniz.</p><p>Ziyaret öncesi randevu ve yönlendirme için <a href=\"tel:+902244824455\">+90 (224) 482 44 55</a> numaralı telefondan veya <a href=\"mailto:info@beseka.com\">info@beseka.com</a> adresinden bizimle iletişime geçebilirsiniz.</p><p><a href=\"https://maps.google.com/?q=Beseka+Otomotiv+Bursa\" target=\"_blank\" rel=\"noopener noreferrer\">Haritada Aç</a></p>",
      },
    },
  ];

  for (const [index, page] of pages.entries()) {
    await db.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: { ...page, sortOrder: index },
    });
  }

  await db.homeIntro.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      slug: "default",
      eyebrow: fallbackHomeIntro.eyebrow,
      title: fallbackHomeIntro.title,
      body: fallbackHomeIntro.body,
      subtitle: fallbackHomeIntro.subtitle,
      image: fallbackHomeIntro.image,
      primaryLabel: fallbackHomeIntro.primaryLabel,
      primaryHref: fallbackHomeIntro.primaryHref,
      secondaryLabel: fallbackHomeIntro.secondaryLabel,
      secondaryHref: fallbackHomeIntro.secondaryHref,
      isActive: fallbackHomeIntro.isActive,
    },
  });

  await db.blogPost.upsert({
    where: { slug: "automechanika-frankfurt-2026" },
    update: {
      coverImage: "/beseka/blog/automechanika.png",
    },
    create: {
      slug: "automechanika-frankfurt-2026",
      title: { tr: "AutoMechanika Fuarı'ndaki yerimizi aldık!" },
      excerpt: {
        tr: "Automechanika Frankfurt 2026'da yerimizi alıyoruz! 8 - 12 Eylül 2026 tarihleri arasında Almanya'da...",
      },
      content: {
        tr: "Beseka Otomotiv olarak, otomotiv endüstrisinin kalbinin attığı dünyanın lider fuarı Automechanika Frankfurt 2026'da yerimizi alıyoruz!\n\n8 - 12 Eylül 2026 tarihleri arasında Almanya'da gerçekleştireceğimiz bu büyük buluşmada; global kalite standartlarındaki yenilikçi çözümlerimizi paylaşmak, uzman ekibimizle sektöre değer katmak ve kalıcı iş ortaklıklarına imza atmak için heyecanlıyız.",
      },
      coverImage: "/beseka/blog/automechanika.png",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const defaultBanners = [
    {
      title: "Beseka Otomotiv — Otomotiv yedek parça üreticisi",
      image: "/beseka/hero/slide-1.webp",
      href: "/urunler",
      sortOrder: 0,
    },
    {
      title: "Beseka — Yeni ürünler",
      image: "/beseka/hero/slide-2.webp",
      href: "/yeni-urunler",
      sortOrder: 1,
    },
    {
      title: "Beseka — OEM kod arama",
      image: "/beseka/hero/slide-3.webp",
      href: "/urunler",
      sortOrder: 2,
    },
  ];

  for (const banner of defaultBanners) {
    const existing = await db.homeBanner.findFirst({ where: { image: banner.image } });
    if (!existing) {
      await db.homeBanner.create({ data: banner });
    }
  }

  const defaultHomeStats = [
    { value: "40+", label: "Ülke", sub: "5 Kıtada Hizmet", sortOrder: 0 },
    { value: "5.000+", label: "Ref", sub: "En Yüksek Kalite", sortOrder: 1 },
    { value: "100+", label: "Çalışan", sub: "Yüksek Nitelikli", sortOrder: 2 },
    { value: "35+", label: "Yıl", sub: "Üretim Deneyimi", sortOrder: 3 },
  ];

  for (const stat of defaultHomeStats) {
    const existing = await db.homeStat.findFirst({
      where: { label: stat.label, value: stat.value },
    });
    if (!existing) {
      await db.homeStat.create({ data: stat });
    }
  }

  console.log("Seed completed.");
  await syncVehicleCatalog({ importedBy: "seed", skipLog: true });
  console.log("Admin: admin@beseka.com / admin123");
  console.log("B2B: b2b@beseka.com / b2b123");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
