import { besekaAssets } from "@/lib/beseka/assets";

const slugFallbackMap: Record<string, string> = {
  "amortisor-takozlari": besekaAssets.products["B8306.T"],
  "suspansiyon-takozlari": besekaAssets.products.B2306,
  "amortisor-rulmanlari": besekaAssets.products["B8306.T"],
  "motor-sanziman-takozlari": besekaAssets.products.B8376,
  burclar: besekaAssets.products.B2306,
  "viraj-lastikleri": besekaAssets.products.B8359,
  korukler: besekaAssets.products.B6850,
  "diger-urunler": besekaAssets.products.B8359,
  // Eski slug'lar (geçiş dönemi)
  "motor-takozlari": besekaAssets.products.B8376,
  "amortisor-korukleri": besekaAssets.products.B6850,
  "salincak-burclari": besekaAssets.products.B2306,
  "turbo-hortumlari": besekaAssets.products.B8359,
  "direksiyon-korukleri": besekaAssets.products.B6657,
};

export function resolveCategoryImage(options: {
  slug: string;
  categoryImage?: string | null;
  index?: number;
}): string | null {
  if (options.categoryImage) return options.categoryImage;
  if (slugFallbackMap[options.slug]) return slugFallbackMap[options.slug];

  const fallbacks = Object.values(besekaAssets.products);
  return fallbacks[(options.index ?? 0) % fallbacks.length] ?? null;
}

export function enrichCategoriesWithImages<
  T extends {
    slug: string;
    image?: string | null;
  },
>(categories: T[]) {
  return categories.map((cat, index) => ({
    ...cat,
    displayImage: resolveCategoryImage({
      slug: cat.slug,
      categoryImage: cat.image,
      index,
    }),
  }));
}
