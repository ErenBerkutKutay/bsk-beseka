"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  getCatalogNavLinks,
  getContactNavFallbackLinks,
  getCorporateNavLinks,
  getMediaNavLinks,
  getProductionNavLinks,
  getQualityNavLinks,
} from "@/lib/navigation/site-nav-links";

type NavLinkItem = { href: string; label: string };

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="nav-hover rounded-lg px-3 py-2 text-base font-semibold text-brand-brown-dark hover:text-white"
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
  links: NavLinkItem[];
  prefix: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="nav-hover rounded-lg px-3 py-2 text-base font-semibold text-brand-brown-dark hover:text-white"
      >
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

function ContactNavDropdown({ prefix }: { prefix: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [links, setLinks] = useState(getContactNavFallbackLinks(t));

  useEffect(() => {
    fetch("/api/contact/pages")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setLinks(
            data.map((item: { slug: string; href: string; label: string }) => ({
              slug: item.slug,
              href: item.href,
              label: item.label,
            })),
          );
        }
      })
      .catch(() => setLinks(getContactNavFallbackLinks(t)));
  }, [locale]);

  return (
    <div className="group relative">
      <button
        type="button"
        className="nav-hover rounded-lg px-3 py-2 text-base font-semibold text-brand-brown-dark hover:text-white"
      >
        {t("contact")}
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-[240px] translate-y-2 rounded-xl border border-border bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {links.map((link) => (
          <Link
            key={link.slug}
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

function QualityNavDropdown({ prefix }: { prefix: string }) {
  const t = useTranslations("nav");
  const links = getQualityNavLinks(t);

  return (
    <div className="group relative">
      <button
        type="button"
        className="nav-hover rounded-lg px-3 py-2 text-base font-semibold text-brand-brown-dark hover:text-white"
      >
        {t("quality")}
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-[240px] translate-y-2 rounded-xl border border-border bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {links.map((link) => (
          <Link
            key={link.slug}
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

function MediaNavDropdown({ prefix }: { prefix: string }) {
  const t = useTranslations("nav");
  const links = getMediaNavLinks(t);

  return (
    <div className="group relative">
      <button
        type="button"
        className="nav-hover rounded-lg px-3 py-2 text-base font-semibold text-brand-brown-dark hover:text-white"
      >
        {t("media")}
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-[240px] translate-y-2 rounded-xl border border-border bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {links.map((link) => (
          <Link
            key={link.slug}
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

export function SiteFooterNav({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const prefix = `/${locale}`;
  const [contactLinks, setContactLinks] = useState(getContactNavFallbackLinks(t));

  useEffect(() => {
    fetch("/api/contact/pages")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setContactLinks(
            data.map((item: { slug: string; href: string; label: string }) => ({
              slug: item.slug,
              href: item.href,
              label: item.label,
            })),
          );
        }
      })
      .catch(() => setContactLinks(getContactNavFallbackLinks(t)));
  }, [locale]);

  const sections = [
    { title: t("corporate"), links: getCorporateNavLinks(t) },
    { title: t("catalog"), links: getCatalogNavLinks(t) },
    {
      title: `${t("production")} & ${t("quality")}`,
      links: [
        ...getProductionNavLinks(t),
        ...getQualityNavLinks(t).map((link) => ({ href: link.href, label: link.label })),
      ],
    },
    {
      title: t("media"),
      links: getMediaNavLinks(t).map((link) => ({ href: link.href, label: link.label })),
    },
    {
      title: t("contact"),
      links: contactLinks.map((link) => ({ href: link.href, label: link.label })),
    },
  ];

  return (
    <nav className={className}>
      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8 lg:gap-y-0">
        {sections.map((section) => (
          <FooterNavColumn
            key={section.title}
            title={section.title}
            links={section.links}
            prefix={prefix}
          />
        ))}
      </div>
    </nav>
  );
}

function FooterNavColumn({
  title,
  links,
  prefix,
}: {
  title: string;
  links: NavLinkItem[];
  prefix: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-[13px] font-bold uppercase leading-snug text-brand-brown">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={`${prefix}${link.href}`}
              className="text-sm leading-snug text-zinc-600 transition-colors hover:text-brand-brown"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteMainNav({
  variant = "header",
  className = "",
}: {
  variant?: "header";
  className?: string;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const prefix = `/${locale}`;

  const corporateLinks = getCorporateNavLinks(t);
  const catalogLinks = getCatalogNavLinks(t);
  const productionLinks = getProductionNavLinks(t);

  return (
    <nav className={`flex flex-wrap items-center gap-1 ${className}`}>
      <NavDropdown title={t("corporate")} links={corporateLinks} prefix={prefix} />
      <NavDropdown title={t("catalog")} links={catalogLinks} prefix={prefix} />
      <NavDropdown title={t("production")} links={productionLinks} prefix={prefix} />
      <QualityNavDropdown prefix={prefix} />
      <MediaNavDropdown prefix={prefix} />
      <ContactNavDropdown prefix={prefix} />
      <LanguageSwitcher />
    </nav>
  );
}
