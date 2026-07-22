"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CATALOG_RESULTS_ID } from "@/lib/catalog/navigation";

function buildPageHref(
  locale: string,
  searchParams: URLSearchParams,
  page: number,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const query = params.toString();
  return `/${locale}/urunler${query ? `?${query}` : ""}#${CATALOG_RESULTS_ID}`;
}

export function CatalogPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const locale = useLocale();
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <Link href={buildPageHref(locale, searchParams, page - 1)}>
        <Button variant="outline" size="sm" disabled={page <= 1}>
          {t("prevPage")}
        </Button>
      </Link>
      <span className="px-2 text-sm text-muted">
        {t("pageOf", { page, total: totalPages })}
      </span>
      <Link href={buildPageHref(locale, searchParams, page + 1)}>
        <Button variant="outline" size="sm" disabled={page >= totalPages}>
          {t("nextPage")}
        </Button>
      </Link>
    </div>
  );
}
