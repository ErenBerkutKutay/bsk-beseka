"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getContactNavFallbackLinks } from "@/lib/navigation/site-nav-links";

type ContactNavLink = {
  slug: string;
  href: string;
  label: string;
};

export function ContactNavDropdown({ prefix }: { prefix: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [links, setLinks] = useState<ContactNavLink[]>([]);

  useEffect(() => {
    fetch("/api/contact/pages")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => setLinks([]));
  }, [locale]);

  const fallbackLinks: ContactNavLink[] = getContactNavFallbackLinks(t);

  const items = links.length ? links : fallbackLinks;

  return (
    <div className="group relative">
      <button className="nav-hover rounded-lg px-3 py-2 text-sm font-medium text-brand-brown-dark hover:text-white">
        {t("contact")}
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-[240px] translate-y-2 rounded-xl border border-border bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {items.map((link) => (
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

export function ContactMobileLinks({
  prefix,
  onNavigate,
}: {
  prefix: string;
  onNavigate: () => void;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [links, setLinks] = useState<ContactNavLink[]>([]);

  useEffect(() => {
    fetch("/api/contact/pages")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => setLinks([]));
  }, [locale]);

  const fallbackLinks: ContactNavLink[] = getContactNavFallbackLinks(t);

  const items = links.length ? links : fallbackLinks;

  return (
    <>
      <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-brand-brown">
        {t("contact")}
      </p>
      {items.map((link) => (
        <Link
          key={link.slug}
          href={`${prefix}${link.href}`}
          onClick={onNavigate}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-brown-dark transition-colors hover:bg-brand-cream-light"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
