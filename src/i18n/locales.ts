import type { AppLocale } from "@/i18n/routing";

export type LocaleOption = {
  code: AppLocale;
  label: string;
  flag: string;
};

/** Üst bar dil seçici — sıra sabit. */
export const localeOptions: LocaleOption[] = [
  { code: "tr", label: "TR", flag: "🇹🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "ar", label: "AR", flag: "🇸🇦" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
];

export const rtlLocales = new Set<AppLocale>(["ar"]);
