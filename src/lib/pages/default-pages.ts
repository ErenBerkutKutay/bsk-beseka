import { db } from "@/lib/db";
import type { PageType } from "@/generated/prisma/client";
import {
  DEFAULT_MAP_EMBED_URL,
  DEFAULT_MAP_LINK,
  type ContactPageMetadata,
} from "@/lib/contact/page-metadata";

type DefaultPage = {
  slug: string;
  type: PageType;
  title: Record<string, string>;
  content: Record<string, string>;
  metadata: ContactPageMetadata;
  sortOrder: number;
};

/** Eski HTML tabanlı içerikler — otomatik düz metne çevrilir. */
export const legacyContactHtmlContent: Record<string, string[]> = {
  "iletisim-bilgiler": [
    "<p><strong>Telefon:</strong> +90 (224) 482 44 55</p><p><strong>E-posta:</strong> info@beseka.com</p><p>Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri</p>",
  ],
  "iletisim-nasil-gidilir": [
    '<p>Beseka Otomotiv üretim tesislerimiz Bursa\'dadır. Karayolu ile Bursa yönünden gelirken navigasyon uygulamanızda "Beseka Otomotiv" araması yapabilirsiniz.</p><p>Ziyaret öncesi randevu ve yönlendirme için <a href="tel:+902244824455">+90 (224) 482 44 55</a> numaralı telefondan veya <a href="mailto:info@beseka.com">info@beseka.com</a> adresinden bizimle iletişime geçebilirsiniz.</p><p><a href="https://maps.google.com/?q=Beseka+Otomotiv+Bursa" target="_blank" rel="noopener noreferrer">Haritada Aç</a></p>',
    '<section><h3>Bursa\'dan Varış</h3><p>Beseka Otomotiv tesislerine Bursa içi ulaşım için navigasyon uygulamanızda "Beseka Otomotiv" araması yapabilirsiniz.</p></section><section><h3>İstanbul\'dan Varış</h3><p>İstanbul yönünden Bursa otoyolunu takip ederek Bursa çıkışından fabrikamıza ulaşabilirsiniz. Ziyaret öncesi randevu almanızı rica ederiz.</p></section>',
  ],
};

export function shouldRefreshContactContent(slug: string, existingTr?: string) {
  if (!existingTr?.trim()) return false;

  const knownLegacy = legacyContactHtmlContent[slug] ?? [];
  if (knownLegacy.includes(existingTr)) return true;

  if (slug === "iletisim-nasil-gidilir" && /<section|<h3|<\/p>/i.test(existingTr)) return true;
  if (slug === "iletisim-bilgiler" && /<p><strong>Telefon:<\/strong>/i.test(existingTr)) return true;

  return false;
}

export const defaultContactPageContent = {
  info: {
    tr: "Ekibimiz size daha iyi yardımcı olmak için burada. Sorularınız, teklif talepleriniz ve iş birliği önerileriniz için satış ekibimizle iletişime geçebilirsiniz.",
  },
  directions: {
    tr: `Bursa'dan Varış

Beseka Otomotiv tesislerine Bursa içi ulaşım için navigasyon uygulamanızda "Beseka Otomotiv" araması yapabilirsiniz.

İstanbul'dan Varış

İstanbul yönünden Bursa otoyolunu takip ederek Bursa çıkışından fabrikamıza ulaşabilirsiniz. Ziyaret öncesi randevu almanızı rica ederiz.

Ziyaret öncesi randevu ve yönlendirme için +90 (224) 482 44 55 numaralı telefondan veya info@beseka.com adresinden bizimle iletişime geçebilirsiniz.

Konumumuzu harita üzerinden görüntülemek için sayfadaki Google Maps bağlantısını kullanabilirsiniz.`,
  },
} as const;

export const defaultContactPages: DefaultPage[] = [
  {
    slug: "iletisim-bilgiler",
    type: "CONTACT",
    title: { tr: "İletişim Bilgileri" },
    content: defaultContactPageContent.info,
    metadata: {
      template: "info",
      subtitle: { tr: "Ekibimiz size daha iyi yardımcı olmak için burada." },
      teamSectionTitle: { tr: "Satış Ekibi" },
      companyName: "Beseka Otomotiv San. ve Tic. Ltd. Şti.",
      address: "Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri",
      postalCode: "",
      gps: "",
      phone: "+90 (224) 482 44 55",
      fax: "",
      email: "info@beseka.com",
      mapLink: DEFAULT_MAP_LINK,
      mapEmbedUrl: DEFAULT_MAP_EMBED_URL,
    },
    sortOrder: 0,
  },
  {
    slug: "iletisim-mesaj",
    type: "CONTACT",
    title: { tr: "Mesaj Gönder" },
    content: {
      tr: "Müşteri temsilcilerimiz en kısa sürede sizinle iletişime geçecektir.",
    },
    metadata: {
      template: "message",
      formIntroTitle: { tr: "Sizi Dinliyoruz!" },
      phone: "+90 (224) 482 44 55",
      email: "info@beseka.com",
      address: "Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri",
      kvkkHref: "/tr/kurumsal/kvkk",
    },
    sortOrder: 1,
  },
  {
    slug: "iletisim-nasil-gidilir",
    type: "CONTACT",
    title: { tr: "Beseka'ya Nasıl Gidilir" },
    content: defaultContactPageContent.directions,
    metadata: {
      template: "directions",
      mapLink: DEFAULT_MAP_LINK,
      mapEmbedUrl: DEFAULT_MAP_EMBED_URL,
      companyName: "Beseka Otomotiv San. ve Tic. Ltd. Şti.",
      address: "Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri",
      phone: "+90 (224) 482 44 55",
      email: "info@beseka.com",
    },
    sortOrder: 2,
  },
];

export const defaultQualityPages = [
  {
    slug: "arge-kalite-yonetimi",
    type: "RD" as const,
    title: { tr: "Kalite Yönetimi" },
    content: {
      tr: "Beseka Otomotiv'de kalite yönetim sistemi, üretimden sevkiyata kadar tüm süreçlerde sürekli iyileştirme ve müşteri memnuniyetini esas alır.",
    },
    sortOrder: 0,
  },
  {
    slug: "arge-belgelendirme",
    type: "RD" as const,
    title: { tr: "Belgelendirme" },
    content: {
      tr: "Uluslararası kalite standartlarına uygun belgelerimiz ve sertifikalarımız aşağıda yer almaktadır.",
    },
    sortOrder: 1,
  },
  {
    slug: "arge-omur-testleri",
    type: "RD" as const,
    title: { tr: "Ömür Testleri" },
    content: {
      tr: "Ürünlerimizin dayanıklılık ve performansını gösteren ömür testi videolarını aşağıdan izleyebilirsiniz.",
    },
    sortOrder: 2,
  },
] as const;

export const defaultContactTeamMembers = [
  {
    name: "Satış Destek",
    email: "info@beseka.com",
    phone: "+90 (224) 482 44 55",
    role: { tr: "Satış Ekibi" },
    sortOrder: 0,
  },
];

async function upsertDefaultPage(page: DefaultPage) {
  const existing = await db.page.findUnique({ where: { slug: page.slug } });
  const existingTr =
    existing?.content && typeof existing.content === "object"
      ? (existing.content as Record<string, string>).tr
      : undefined;
  const shouldRefreshContent = shouldRefreshContactContent(page.slug, existingTr);

  await db.page.upsert({
    where: { slug: page.slug },
    update: {
      metadata: page.metadata,
      ...(shouldRefreshContent ? { content: page.content } : {}),
    },
    create: {
      slug: page.slug,
      type: page.type,
      title: page.title,
      content: page.content,
      metadata: page.metadata,
      sortOrder: page.sortOrder,
      isActive: true,
      images: [],
    },
  });
}

export async function ensureContactTeamMembers() {
  const count = await db.contactTeamMember.count();
  if (count > 0) return db.contactTeamMember.findMany({ orderBy: { sortOrder: "asc" } });

  for (const member of defaultContactTeamMembers) {
    await db.contactTeamMember.create({ data: member });
  }

  return db.contactTeamMember.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function ensureContactPages() {
  for (const page of defaultContactPages) {
    await upsertDefaultPage(page);
  }
  await ensureContactTeamMembers();
  return db.page.findMany({
    where: { type: "CONTACT", isActive: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });
}

export async function ensureQualityPages() {
  for (const page of defaultQualityPages) {
    await db.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        ...page,
        isActive: true,
        images: [],
        metadata: { documents: [], videos: [] },
      },
    });
  }
  return db.page.findMany({
    where: { slug: { in: defaultQualityPages.map((p) => p.slug) } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function ensureDefaultPages(scope: "contact" | "quality" | "all") {
  if (scope === "contact" || scope === "all") {
    await ensureContactPages();
  }
  if (scope === "quality" || scope === "all") {
    await ensureQualityPages();
  }
}
