"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { localeOptions } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  className?: string;
  variant?: "nav" | "mobile";
};

export function LanguageSwitcher({ className = "", variant = "nav" }: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const current = localeOptions.find((option) => option.code === locale) ?? localeOptions[0];

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  if (variant === "mobile") {
    return (
      <div className={className}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-brown">
          {t("switchLabel")}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {localeOptions.map((option) => {
            const active = option.code === locale;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => switchLocale(option.code)}
                aria-current={active ? "true" : undefined}
                className={`rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-brown-dark text-white"
                    : "bg-brand-cream-light text-brand-brown-dark hover:bg-brand-cream"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      <button
        type="button"
        aria-label={t("switchLabel")}
        aria-haspopup="listbox"
        className="nav-hover flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-brand-brown-dark hover:text-white"
      >
        {current.label}
        <ChevronDown className="h-4 w-4 opacity-70 transition-transform group-hover:rotate-180" />
      </button>
      <ul
        role="listbox"
        aria-label={t("switchLabel")}
        className="invisible absolute right-0 top-full z-50 min-w-[120px] translate-y-2 rounded-xl border border-border bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
      >
        {localeOptions.map((option) => {
          const active = option.code === locale;
          return (
            <li key={option.code} role="option" aria-selected={active}>
              <button
                type="button"
                onClick={() => switchLocale(option.code)}
                className={`mx-1 block w-[calc(100%-0.5rem)] rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-brown-dark text-white"
                    : "text-brand-brown-dark hover:bg-brand-cream-light"
                }`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
