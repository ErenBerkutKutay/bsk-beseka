import { defineRouting } from "next-intl/routing";

export const locales = ["tr", "en", "de", "it", "fr", "es", "ar", "ru"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "tr",
  localePrefix: "always",
});
