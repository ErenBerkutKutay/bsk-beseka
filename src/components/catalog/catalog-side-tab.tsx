"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { shouldShowCatalogSideTab } from "@/lib/catalog/navigation";

export function CatalogSideTab() {
  const locale = useLocale();
  const t = useTranslations("catalog");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!shouldShowCatalogSideTab(pathname, searchParams)) {
    return null;
  }

  return (
    <Link
      href={`/${locale}/urunler?catalog=1`}
      className="catalog-side-tab fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-md bg-[#c62828] py-3 pl-2 pr-3 text-white shadow-lg transition hover:bg-[#b71c1c] hover:pr-4"
      aria-label={t("sideTabLabel")}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-white p-0.5">
        <Image
          src="/beseka/logo/beseka-logo-transparent.png"
          alt=""
          width={24}
          height={24}
          className="h-5 w-5 object-contain"
        />
      </span>
      <span className="hidden whitespace-nowrap text-sm font-bold tracking-tight sm:inline">
        {t("sideTabText")}
      </span>
    </Link>
  );
}
