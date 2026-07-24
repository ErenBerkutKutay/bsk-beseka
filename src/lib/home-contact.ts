import { db } from "@/lib/db";
import { fallbackHomeContact, hexToRgba, type HomeContactContent } from "@/lib/beseka/home-contact";
import { parseLocalizedContent } from "@/lib/i18n/localized-content";

export { hexToRgba };

function mapHomeContact(row: {
  eyebrow: unknown;
  title: unknown;
  companyName: unknown;
  address: unknown;
  phone: string;
  email: string;
  image: string;
  buttonLabel: unknown;
  buttonHref: string;
  textPanelEnabled: boolean;
  textPanelColor: string;
  textPanelOpacity: number;
  isActive: boolean;
}): HomeContactContent {
  return {
    eyebrow: parseLocalizedContent(row.eyebrow),
    title: parseLocalizedContent(row.title),
    companyName: parseLocalizedContent(row.companyName),
    address: parseLocalizedContent(row.address),
    phone: row.phone,
    email: row.email,
    image: row.image,
    buttonLabel: parseLocalizedContent(row.buttonLabel),
    buttonHref: row.buttonHref,
    textPanelEnabled: row.textPanelEnabled,
    textPanelColor: row.textPanelColor,
    textPanelOpacity: row.textPanelOpacity,
    isActive: row.isActive,
  };
}

export async function getHomeContactContent(): Promise<HomeContactContent> {
  try {
    const row = await db.homeContact.findUnique({ where: { slug: "default" } });
    if (!row) return fallbackHomeContact;
    return mapHomeContact(row);
  } catch {
    return fallbackHomeContact;
  }
}

export async function getAdminHomeContact() {
  const row = await db.homeContact.findUnique({ where: { slug: "default" } });
  if (!row) return { id: null, ...fallbackHomeContact };
  return { id: row.id, ...mapHomeContact(row) };
}
