import type { AppLocale } from "@/i18n/routing";

export type ContactPageTemplate = "info" | "message" | "directions";

export type ContactPageMetadata = {
  template: ContactPageTemplate;
  subtitle?: Partial<Record<AppLocale, string>>;
  teamSectionTitle?: Partial<Record<AppLocale, string>>;
  companyName?: string;
  address?: string;
  postalCode?: string;
  gps?: string;
  phone?: string;
  fax?: string;
  email?: string;
  mapLink?: string;
  mapEmbedUrl?: string;
  formIntroTitle?: Partial<Record<AppLocale, string>>;
  kvkkHref?: string;
};

export const DEFAULT_MAP_LINK = "https://maps.app.goo.gl/cDnvbYeeyvNyid5X6";

export const DEFAULT_MAP_EMBED_URL =
  "https://maps.google.com/maps?q=Beseka+Otomotiv+Bursa&hl=tr&z=16&output=embed";

export function contactRouteSlug(pageSlug: string) {
  return pageSlug.startsWith("iletisim-") ? pageSlug.slice("iletisim-".length) : pageSlug;
}

export function contactPageSlug(routeSlug: string) {
  return routeSlug.startsWith("iletisim-") ? routeSlug : `iletisim-${routeSlug}`;
}

export function parseContactMetadata(raw: unknown): ContactPageMetadata {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<ContactPageMetadata>;
  return {
    template: data.template === "message" || data.template === "directions" ? data.template : "info",
    subtitle: data.subtitle,
    teamSectionTitle: data.teamSectionTitle,
    companyName: data.companyName,
    address: data.address,
    postalCode: data.postalCode,
    gps: data.gps,
    phone: data.phone,
    fax: data.fax,
    email: data.email,
    mapLink: data.mapLink || DEFAULT_MAP_LINK,
    mapEmbedUrl: data.mapEmbedUrl || DEFAULT_MAP_EMBED_URL,
    formIntroTitle: data.formIntroTitle,
    kvkkHref: data.kvkkHref || "/tr/kurumsal/kvkk",
  };
}

export function localizedMetaText(
  values: Partial<Record<AppLocale, string>> | undefined,
  locale: string,
  fallback = "",
) {
  if (!values) return fallback;
  return values[locale as AppLocale] || values.tr || fallback;
}
