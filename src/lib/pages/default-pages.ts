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

export const defaultContactPages: DefaultPage[] = [
  {
    slug: "iletisim-bilgiler",
    type: "CONTACT",
    title: { tr: "İletişim Bilgileri" },
    content: {
      tr: "Ekibimiz size daha iyi yardımcı olmak için burada.",
    },
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
    content: {
      tr: '<section><h3>Bursa\'dan Varış</h3><p>Beseka Otomotiv tesislerine Bursa içi ulaşım için navigasyon uygulamanızda "Beseka Otomotiv" araması yapabilirsiniz.</p></section><section><h3>İstanbul\'dan Varış</h3><p>İstanbul yönünden Bursa otoyolunu takip ederek Bursa çıkışından fabrikamıza ulaşabilirsiniz. Ziyaret öncesi randevu almanızı rica ederiz.</p></section>',
    },
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

export const defaultQualityPage = {
  slug: "arge-kalite-kontrol",
  type: "RD" as const,
  title: { tr: "Kalite Kontrol" },
  content: {
    tr: "Laboratuvar testleri ve saha validasyon süreçleriyle her ürün OEM standartlarında kontrol edilir.",
  },
  sortOrder: 0,
};

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
  await db.page.upsert({
    where: { slug: page.slug },
    update: {
      metadata: page.metadata,
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

export async function ensureQualityPage() {
  await db.page.upsert({
    where: { slug: defaultQualityPage.slug },
    update: {},
    create: {
      ...defaultQualityPage,
      isActive: true,
      images: [],
    },
  });
  return db.page.findUnique({ where: { slug: defaultQualityPage.slug } });
}

export async function ensureDefaultPages(scope: "contact" | "quality" | "all") {
  if (scope === "contact" || scope === "all") {
    await ensureContactPages();
  }
  if (scope === "quality" || scope === "all") {
    await ensureQualityPage();
  }
}
