import { besekaAssets } from "@/lib/beseka/assets";

export type HeroBannerItem = {
  id?: string;
  image: string;
  href: string;
  alt: string;
};

export const fallbackHomeBanners: HeroBannerItem[] = [
  {
    image: besekaAssets.hero[0],
    href: "/urunler",
    alt: "Beseka Otomotiv — Otomotiv yedek parça üreticisi",
  },
  {
    image: besekaAssets.hero[1],
    href: "/yeni-urunler",
    alt: "Beseka — Yeni ürünler",
  },
  {
    image: besekaAssets.hero[2],
    href: "/urunler",
    alt: "Beseka — OEM kod arama",
  },
];
