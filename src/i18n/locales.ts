import type { AppLocale } from "@/i18n/routing";

export type LocaleOption = {
  code: AppLocale;
  label: string;
};

/** Üst bar dil seçici — sıra sabit. */
export const localeOptions: LocaleOption[] = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "ar", label: "AR" },
  { code: "ru", label: "RU" },
];

export const rtlLocales = new Set<AppLocale>(["ar"]);
