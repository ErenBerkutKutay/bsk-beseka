import type { AppLocale } from "@/i18n/routing";
import { getLocalizedText, type LocalizedText } from "@/lib/utils";

type CategoryNames = Record<AppLocale, string>;

export const PRODUCT_GROUPS: ReadonlyArray<{ slug: string; name: CategoryNames }> = [
  {
    slug: "amortisor-takozlari",
    name: {
      tr: "Amortisör Takozları",
      en: "Shock Absorber Mounts",
      de: "Stoßdämpferlager",
      it: "Supporti ammortizzatore",
      fr: "Supports d'amortisseur",
      es: "Soportes de amortiguador",
      ar: "قواعد ممتص الصدمات",
      ru: "Опоры амортизатора",
    },
  },
  {
    slug: "suspansiyon-takozlari",
    name: {
      tr: "Süspansiyon Takozları",
      en: "Suspension Mounts",
      de: "Federungslager",
      it: "Supporti sospensione",
      fr: "Supports de suspension",
      es: "Soportes de suspensión",
      ar: "قواعد التعليق",
      ru: "Опоры подвески",
    },
  },
  {
    slug: "amortisor-rulmanlari",
    name: {
      tr: "Amortisör Rulmanları",
      en: "Shock Absorber Bearings",
      de: "Stoßdämpferlagerungen",
      it: "Cuscinetti ammortizzatore",
      fr: "Roulements d'amortisseur",
      es: "Rodamientos de amortiguador",
      ar: "محامل ممتص الصدمات",
      ru: "Подшипники амортизатора",
    },
  },
  {
    slug: "motor-sanziman-takozlari",
    name: {
      tr: "Motor ve Şanzıman Takozları",
      en: "Engine & Transmission Mounts",
      de: "Motor- & Getriebelager",
      it: "Supporti motore e cambio",
      fr: "Supports moteur et boîte",
      es: "Soportes motor y transmisión",
      ar: "قواعد المحرك وناقل الحركة",
      ru: "Опоры двигателя и КПП",
    },
  },
  {
    slug: "burclar",
    name: {
      tr: "Burçlar",
      en: "Bushings",
      de: "Buchsen",
      it: "Boccole",
      fr: "Bagues",
      es: "Bujes",
      ar: "البوشات",
      ru: "Втулки",
    },
  },
  {
    slug: "viraj-lastikleri",
    name: {
      tr: "Viraj Lastikleri",
      en: "Anti-Roll Bar Bushes",
      de: "Stabilisatorgummis",
      it: "Silent block barra stabilizzatrice",
      fr: "Silent-blocs de barre stabilisatrice",
      es: "Casquillos de barra estabilizadora",
      ar: "مطاطات المثبت",
      ru: "Втулки стабилизатора",
    },
  },
  {
    slug: "korukler",
    name: {
      tr: "Körükler",
      en: "Bellows & Boots",
      de: "Faltenbälge",
      it: "Soffietti",
      fr: "Soufflets",
      es: "Fuelles",
      ar: "الأغطية المطاطية",
      ru: "Пыльники",
    },
  },
  {
    slug: "diger-urunler",
    name: {
      tr: "Diğer Ürünler",
      en: "Other Products",
      de: "Sonstige Produkte",
      it: "Altri prodotti",
      fr: "Autres produits",
      es: "Otros productos",
      ar: "منتجات أخرى",
      ru: "Прочая продукция",
    },
  },
];

/** Eski slug → yeni slug (ürün taşıma) */
export const LEGACY_CATEGORY_SLUG_MAP: Record<string, string> = {
  "motor-takozlari": "motor-sanziman-takozlari",
  "salincak-burclari": "suspansiyon-takozlari",
  "amortisor-korukleri": "korukler",
  "direksiyon-korukleri": "korukler",
  "turbo-hortumlari": "diger-urunler",
};

export const DEPRECATED_CATEGORY_SLUGS = Object.keys(LEGACY_CATEGORY_SLUG_MAP);

export function normalizeCategorySlug(slug: string): string {
  return LEGACY_CATEGORY_SLUG_MAP[slug] ?? slug;
}

export function getProductGroupLabel(slug: string, locale = "tr"): string {
  const normalized = normalizeCategorySlug(slug);
  const group = PRODUCT_GROUPS.find((g) => g.slug === normalized);
  if (!group) return slug;
  const loc = locale as AppLocale;
  return group.name[loc] || group.name.tr;
}

export function resolveCategoryLabel(
  slug: string,
  locale: string,
  dbName?: LocalizedText | Record<string, string> | null,
): string {
  const fromDb = getLocalizedText(dbName, locale);
  if (fromDb) return fromDb;
  return getProductGroupLabel(slug, locale);
}
