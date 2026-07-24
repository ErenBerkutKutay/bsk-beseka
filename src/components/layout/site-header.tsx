"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, Phone, Search, X } from "lucide-react";
import { besekaAssets } from "@/lib/beseka/assets";
import { BESEKA_B2B_URL } from "@/lib/beseka/links";
import { ProductSearchForm } from "@/components/catalog/product-search-form";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SiteMainNav } from "@/components/layout/site-main-nav";
import { SocialFollowLinks } from "@/components/layout/social-follow-links";
import { ContactMobileLinks } from "@/components/contact/contact-nav-dropdown";
import { MediaMobileLinks } from "@/components/media/media-nav-dropdown";
import { QualityMobileLinks } from "@/components/quality/quality-nav-dropdown";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefix = `/${locale}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg shadow-brand-brown/10" : ""
      }`}
    >
      <div className="bg-brand-brown-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href="tel:+902244824455"
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4" />
              +90 (224) 482 44 55
            </a>
            <span className="hidden sm:inline opacity-80">info@beseka.com</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SocialFollowLinks className="hidden lg:flex" />
            <SocialFollowLinks className="lg:hidden" showLabel={false} iconClassName="h-3.5 w-3.5" />
            <a
              href={BESEKA_B2B_URL}
              className="rounded bg-brand-cream px-2.5 py-0.5 text-xs font-bold tracking-wide text-brand-brown-dark transition hover:bg-white"
            >
              B2B
            </a>
          </div>
        </div>
      </div>

      <div
        className={`border-b border-border bg-white/95 backdrop-blur-md transition-all ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 lg:gap-5">
          <Link href={prefix} className="flex shrink-0 items-center transition-transform hover:scale-[1.03]">
            <Image
              src={besekaAssets.logo}
              alt="Beseka Otomotiv"
              width={200}
              height={44}
              className={`block object-contain object-left transition-all ${
                scrolled ? "h-9 w-[148px]" : "h-10 w-[160px] sm:h-11 sm:w-[184px]"
              }`}
              priority
            />
          </Link>

          <div className="hidden min-w-0 flex-1 md:ml-4 md:block lg:ml-6 lg:max-w-lg xl:max-w-xl">
            <ProductSearchForm key={locale} variant="header" />
          </div>

          <div className="hidden shrink-0 lg:block">
            <SiteMainNav variant="header" />
          </div>

          <button
            className="ml-auto rounded-lg p-2 text-brand-brown lg:ml-0 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={t("menu")}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-b border-border bg-white transition-all duration-300 lg:hidden ${
          open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          <div className="mb-3 md:hidden">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-brown">
              <Search className="h-3.5 w-3.5" />
              {t("searchProducts")}
            </p>
            <ProductSearchForm key={locale} variant="header" onNavigate={() => setOpen(false)} />
          </div>
          <MobileLink href={`${prefix}/urunler`} onClick={() => setOpen(false)}>
            {t("catalog")}
          </MobileLink>
          <MobileLink href={`${prefix}/yeni-urunler`} onClick={() => setOpen(false)}>
            {t("newProducts")}
          </MobileLink>
          <QualityMobileLinks prefix={prefix} onNavigate={() => setOpen(false)} />
          <MediaMobileLinks prefix={prefix} onNavigate={() => setOpen(false)} />
          <ContactMobileLinks prefix={prefix} onNavigate={() => setOpen(false)} />
          <LanguageSwitcher variant="mobile" className="mt-2 px-3" />
          <a
            href={BESEKA_B2B_URL}
            onClick={() => setOpen(false)}
            className="rounded-lg bg-brand-cream px-3 py-2.5 text-sm font-medium text-brand-brown-dark transition-colors"
          >
            {t("b2b")}
          </a>
        </div>
      </div>
    </header>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  accent,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        accent
          ? "bg-brand-cream text-brand-brown-dark"
          : "text-brand-brown-dark hover:bg-brand-cream-light"
      }`}
    >
      {children}
    </Link>
  );
}
