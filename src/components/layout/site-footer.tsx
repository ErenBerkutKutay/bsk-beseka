"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SiteFooterNav } from "@/components/layout/site-main-nav";

export function SiteFooter() {
  const tFooter = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-border bg-white text-brand-brown-dark">
      <div className="border-b border-border/60 bg-zinc-100/90">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          <SiteFooterNav />
        </div>
      </div>

      <div className="bg-white px-4 py-5 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-sm text-muted lg:flex-row lg:gap-6 lg:text-left">
          <p className="max-w-3xl leading-relaxed">{tFooter("legalDisclaimer")}</p>
          <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row sm:gap-6">
            <LanguageSwitcher />
            <p className="text-brand-brown-dark">
              © {new Date().getFullYear()} Beseka Otomotiv. {tFooter("rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
