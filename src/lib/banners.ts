import { db } from "@/lib/db";
import { fallbackHomeBanners, type HeroBannerItem } from "@/lib/beseka/home-banners";

function mapRows(rows: { id: string; image: string; href: string | null; title: string | null }[]) {
  return rows
    .filter((row) => row.image?.trim())
    .map((row) => ({
      id: row.id,
      image: row.image,
      href: row.href || "/urunler",
      alt: row.title || "Beseka Otomotiv banner",
    }));
}

export async function getActiveHomeBanners(): Promise<HeroBannerItem[]> {
  try {
    const rows = await db.homeBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const mapped = mapRows(rows);
    return mapped.length ? mapped : fallbackHomeBanners;
  } catch {
    return fallbackHomeBanners;
  }
}

export async function getAllHomeBanners() {
  return db.homeBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
