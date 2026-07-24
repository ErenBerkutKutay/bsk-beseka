import type { AppLocale } from "@/i18n/routing";

export type LocaleOption = {
  code: AppLocale;
  label: string;
  flagSrc: string;
};

/** Üst bar dil seçici — sıra sabit. Bayraklar PNG (Windows uyumlu). */
export const localeOptions: LocaleOption[] = [
  { code: "tr", label: "TR", flagSrc: "/flags/tr.png" },
  { code: "en", label: "EN", flagSrc: "/flags/gb.png" },
  { code: "de", label: "DE", flagSrc: "/flags/de.png" },
  { code: "it", label: "IT", flagSrc: "/flags/it.png" },
  { code: "fr", label: "FR", flagSrc: "/flags/fr.png" },
  { code: "es", label: "ES", flagSrc: "/flags/es.png" },
  { code: "ar", label: "AR", flagSrc: "/flags/sa.png" },
  { code: "ru", label: "RU", flagSrc: "/flags/ru.png" },
];

export const rtlLocales = new Set<AppLocale>(["ar"]);
