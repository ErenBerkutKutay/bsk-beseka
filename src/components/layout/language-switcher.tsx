"use client";

import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { localeOptions } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  variant?: "dark" | "light";
};

export function LanguageSwitcher({
  className = "",
  compact = false,
  variant = "dark",
}: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <nav
      aria-label={t("switchLabel")}
      className={`flex flex-wrap items-center gap-0.5 ${className}`}
    >
      {localeOptions.map((option, index) => {
        const active = option.code === locale;
        return (
          <span key={option.code} className="flex items-center">
            {index > 0 && !compact && (
              <span className="mx-0.5 text-[10px] opacity-40" aria-hidden>
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => switchLocale(option.code)}
              aria-current={active ? "true" : undefined}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors sm:text-xs ${
                variant === "light"
                  ? active
                    ? "bg-brand-brown-dark text-white"
                    : "text-brand-brown-dark hover:bg-brand-cream-light"
                  : active
                    ? "bg-white text-brand-brown-dark"
                    : "text-white/85 hover:bg-white/15 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
