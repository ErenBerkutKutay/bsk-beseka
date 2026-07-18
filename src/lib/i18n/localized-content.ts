import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { locales, type AppLocale } from "@/i18n/routing";

export const contentLocales = locales;

export function emptyLocalizedContent(): Record<AppLocale, string> {
  return Object.fromEntries(contentLocales.map((locale) => [locale, ""])) as Record<
    AppLocale,
    string
  >;
}

export function parseLocalizedContent(value: unknown): Record<AppLocale, string> {
  const result = emptyLocalizedContent();
  if (!value || typeof value !== "object") return result;

  for (const locale of contentLocales) {
    const text = (value as Record<string, unknown>)[locale];
    result[locale] = typeof text === "string" ? text : "";
  }
  return result;
}

export function buildLocalizedJson(
  values: Partial<Record<AppLocale, string>>,
): Prisma.InputJsonValue {
  const result: Record<string, string> = {};
  for (const locale of contentLocales) {
    const trimmed = (values[locale] || "").trim();
    if (trimmed) result[locale] = trimmed;
  }
  return result;
}

export function buildOptionalLocalizedJson(
  values: Partial<Record<AppLocale, string>>,
): Prisma.InputJsonValue | undefined {
  const json = buildLocalizedJson(values);
  return Object.keys(json).length ? json : undefined;
}

function localizedZodShape(requiredLocale?: AppLocale) {
  const shape: Record<string, z.ZodType<string>> = {};
  for (const locale of contentLocales) {
    shape[locale] =
      locale === requiredLocale
        ? z.string().min(1, "Türkçe alan zorunludur")
        : z.string().optional().default("");
  }
  return shape;
}

export const localizedNameSchema = z.object(localizedZodShape("tr"));

export const localizedDescriptionSchema = z.object(localizedZodShape());

export const localeLabels: Record<AppLocale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  it: "Italiano",
  fr: "Français",
  es: "Español",
  ar: "العربية",
  ru: "Русский",
};
