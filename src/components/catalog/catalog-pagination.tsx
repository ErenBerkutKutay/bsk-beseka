"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 3) {
    start = 2;
    end = Math.min(5, total - 1);
  } else if (current >= total - 2) {
    start = Math.max(2, total - 4);
    end = total - 1;
  }

  if (start > 2) pages.push("ellipsis");

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
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
  const visiblePages = getVisiblePages(page, totalPages);

  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
      aria-label={t("paginationLabel")}
    >
      {page <= 1 ? (
        <Button variant="outline" size="sm" disabled>
          {t("prevPage")}
        </Button>
      ) : (
        <Link href={buildPageHref(locale, searchParams, page - 1)}>
          <Button variant="outline" size="sm">
            {t("prevPage")}
          </Button>
        </Link>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1">
        {visiblePages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-muted"
              aria-hidden="true"
            >
              …
            </span>
          ) : item === page ? (
            <Button
              key={item}
              size="sm"
              className="min-w-9 px-2"
              aria-current="page"
              disabled
            >
              {item}
            </Button>
          ) : (
            <Link key={item} href={buildPageHref(locale, searchParams, item)}>
              <Button
                variant="outline"
                size="sm"
                className={cn("min-w-9 px-2")}
                aria-label={t("goToPage", { page: item })}
              >
                {item}
              </Button>
            </Link>
          ),
        )}
      </div>

      {page >= totalPages ? (
        <Button variant="outline" size="sm" disabled>
          {t("nextPage")}
        </Button>
      ) : (
        <Link href={buildPageHref(locale, searchParams, page + 1)}>
          <Button variant="outline" size="sm">
            {t("nextPage")}
          </Button>
        </Link>
      )}
    </nav>
  );
}
