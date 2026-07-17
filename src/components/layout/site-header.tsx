"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, Phone, Search, X } from "lucide-react";
import { besekaAssets } from "@/lib/beseka/assets";
import { ProductSearchForm } from "@/components/catalog/product-search-form";

const corporateLinks = [
  { href: "/kurumsal/hakkimizda", label: "Hakkımızda" },
  { href: "/kurumsal/kultur", label: "Kurumsal Kültürümüz" },
  { href: "/kurumsal/vizyon-misyon", label: "Vizyon & Misyon" },
  { href: "/kurumsal/degerler", label: "Değerlerimiz" },
  { href: "/kurumsal/surdurulebilirlik", label: "Sürdürülebilirlik" },
];

const productionLinks = [
  { href: "/uretim/kaynak", label: "Kaynak" },
  { href: "/uretim/kaliphane", label: "Kalıphane" },
  { href: "/uretim/cnc", label: "CNC İşleme" },
  { href: "/uretim/vulkanizasyon", label: "Vulkanizasyon" },
  { href: "/uretim/montaj", label: "Montaj" },
];

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
      <div className="bg-brand-brown text-brand-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm">
          <div className="flex items-center gap-4">
            <a
              href="tel:+902244824455"
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4" />
              +90 (224) 482 44 55
            </a>
            <span className="hidden sm:inline opacity-80">info@beseka.com</span>
          </div>
          <Link
            href={`${prefix}/b2b`}
            className="rounded bg-brand-cream px-2.5 py-0.5 text-xs font-bold tracking-wide text-brand-brown-dark transition hover:bg-white"
          >
            B2B
          </Link>
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
              width={160}
              height={36}
              className={`block object-contain object-left transition-all ${
                scrolled ? "h-7 w-[120px]" : "h-8 w-[132px] sm:h-9 sm:w-[148px]"
              }`}
              priority
            />
          </Link>

          <div className="hidden min-w-0 flex-1 md:ml-10 md:block lg:ml-14 lg:max-w-sm xl:ml-20 xl:max-w-md">
            <ProductSearchForm variant="header" />
          </div>

          <nav className="hidden shrink-0 items-center gap-1 lg:flex">
            <NavDropdown title={t("corporate")} links={corporateLinks} prefix={prefix} />
            <NavDropdown
              title={t("catalog")}
              links={[
                { href: "/urunler", label: "Online Katalog" },
                { href: "/yeni-urunler", label: "Yeni Ürünler" },
              ]}
              prefix={prefix}
            />
            <NavDropdown title={t("production")} links={productionLinks} prefix={prefix} />
            <NavLink href={`${prefix}/blog`}>{t("blog")}</NavLink>
            <NavLink href={`${prefix}/iletisim`}>{t("contact")}</NavLink>
          </nav>

          <button
            className="ml-auto rounded-lg p-2 text-brand-brown lg:ml-0 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
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
              Ürün Ara
            </p>
            <ProductSearchForm variant="header" onNavigate={() => setOpen(false)} />
          </div>
          <MobileLink href={`${prefix}/urunler`} onClick={() => setOpen(false)}>
            {t("catalog")}
          </MobileLink>
          <MobileLink href={`${prefix}/yeni-urunler`} onClick={() => setOpen(false)}>
            {t("newProducts")}
          </MobileLink>
          <MobileLink href={`${prefix}/blog`} onClick={() => setOpen(false)}>
            {t("blog")}
          </MobileLink>
          <MobileLink href={`${prefix}/iletisim`} onClick={() => setOpen(false)}>
            {t("contact")}
          </MobileLink>
          <MobileLink href={`${prefix}/b2b`} onClick={() => setOpen(false)} accent>
            {t("b2b")}
          </MobileLink>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="nav-hover rounded-lg px-3 py-2 text-sm font-medium text-brand-brown-dark hover:text-white">
      {children}
    </Link>
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

function NavDropdown({
  title,
  links,
  prefix,
}: {
  title: string;
  links: { href: string; label: string }[];
  prefix: string;
}) {
  return (
    <div className="group relative">
      <button className="nav-hover rounded-lg px-3 py-2 text-sm font-medium text-brand-brown-dark hover:text-white">
        {title}
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-[240px] translate-y-2 rounded-xl border border-border bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {links.map((link) => (
          <Link
            key={link.href}
            href={`${prefix}${link.href}`}
            className="nav-hover mx-1 block rounded-lg px-4 py-2.5 text-sm text-brand-brown-dark hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
