import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Locale = "tr" | "en" | "de" | "it" | "fr" | "es" | "ar" | "ru";

export type LocalizedText = Partial<Record<Locale, string>> & { tr?: string };

export function getLocalizedText(
  value: LocalizedText | Record<string, string> | null | undefined,
  locale: string,
  fallback = "",
): string {
  if (!value) return fallback;
  const key = locale as Locale;
  return value[key] || value.tr || fallback;
}

export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
