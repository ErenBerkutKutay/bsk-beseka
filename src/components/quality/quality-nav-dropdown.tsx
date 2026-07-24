"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { getQualityNavLinks } from "@/lib/navigation/site-nav-links";

export function QualityMobileLinks({
  prefix,
  onNavigate,
}: {
  prefix: string;
  onNavigate: () => void;
}) {
  const t = useTranslations("nav");
  const items = getQualityNavLinks(t);

  return (
    <>
      <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-brand-brown">
        {t("quality")}
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
