import { db } from "@/lib/db";
import { fallbackHomeIntro, type HomeIntroContent } from "@/lib/beseka/home-intro";
import { parseLocalizedContent } from "@/lib/i18n/localized-content";

function mapHomeIntro(row: {
  eyebrow: unknown;
  title: unknown;
  body: unknown;
  subtitle: unknown;
  image: string;
  primaryLabel: unknown;
  primaryHref: string;
  secondaryLabel: unknown;
  secondaryHref: string;
  isActive: boolean;
}): HomeIntroContent {
  return {
    eyebrow: parseLocalizedContent(row.eyebrow),
    title: parseLocalizedContent(row.title),
    body: parseLocalizedContent(row.body),
    subtitle: parseLocalizedContent(row.subtitle),
    image: row.image,
    primaryLabel: parseLocalizedContent(row.primaryLabel),
    primaryHref: row.primaryHref,
    secondaryLabel: parseLocalizedContent(row.secondaryLabel),
    secondaryHref: row.secondaryHref,
    isActive: row.isActive,
  };
}

export async function getHomeIntroContent(): Promise<HomeIntroContent> {
  try {
    const row = await db.homeIntro.findUnique({ where: { slug: "default" } });
    if (!row) return fallbackHomeIntro;
    return mapHomeIntro(row);
  } catch {
    return fallbackHomeIntro;
  }
}

export async function getAdminHomeIntro() {
  const row = await db.homeIntro.findUnique({ where: { slug: "default" } });
  if (!row) return { id: null, ...fallbackHomeIntro };
  return { id: row.id, ...mapHomeIntro(row) };
}
