export const PRODUCT_GROUPS = [
  { slug: "amortisor-takozlari", name: { tr: "Amortisör Takozları" } },
  { slug: "suspansiyon-takozlari", name: { tr: "Süspansiyon Takozları" } },
  { slug: "amortisor-rulmanlari", name: { tr: "Amortisör Rulmanları" } },
  { slug: "motor-sanziman-takozlari", name: { tr: "Motor ve Şanzıman Takozları" } },
  { slug: "burclar", name: { tr: "Burçlar" } },
  { slug: "viraj-lastikleri", name: { tr: "Viraj Lastikleri" } },
  { slug: "korukler", name: { tr: "Körükler" } },
  { slug: "diger-urunler", name: { tr: "Diğer Ürünler" } },
] as const;

/** Eski slug → yeni slug (ürün taşıma) */
export const LEGACY_CATEGORY_SLUG_MAP: Record<string, string> = {
  "motor-takozlari": "motor-sanziman-takozlari",
  "salincak-burclari": "suspansiyon-takozlari",
  "amortisor-korukleri": "korukler",
  "direksiyon-korukleri": "korukler",
  "turbo-hortumlari": "diger-urunler",
};

export const DEPRECATED_CATEGORY_SLUGS = Object.keys(LEGACY_CATEGORY_SLUG_MAP);

export function getProductGroupLabel(slug: string, locale = "tr"): string {
  const group = PRODUCT_GROUPS.find((g) => g.slug === slug);
  if (!group) return slug;
  return group.name[locale as keyof typeof group.name] || group.name.tr;
}
