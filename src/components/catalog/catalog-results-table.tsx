"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check, Search, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildVehicleDisplayRows } from "@/lib/catalog/fitment-display";
import { getLocalizedText, cn } from "@/lib/utils";
import { useCatalogSelection } from "@/components/catalog/catalog-selection-context";

export type CatalogResultProduct = {
  id: string;
  sku: string;
  slug: string;
  name: Record<string, string>;
  images: string[];
  isNew: boolean;
  oemCodes?: { code: string }[];
  crossCodes?: { code: string }[];
  vehicleTypes?: {
    vehicleType: {
      tipNo: number;
      make: string;
      modelSeries: string;
      typeName: string;
      yearFrom?: number | null;
      yearTo?: number | null;
    };
  }[];
};

export function CatalogResultsTable({
  products,
  total,
}: {
  products: CatalogResultProduct[];
  total: number;
}) {
  const locale = useLocale();
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const { toggleProduct, isSelected } = useCatalogSelection();

  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-brand-brown/25 bg-white p-12 text-center shadow-sm md:p-16">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream-light">
          <SearchX className="h-8 w-8 text-brand-brown/60" />
        </div>
        <p className="text-lg font-semibold text-brand-brown-dark">{t("noResults")}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t("noResultsHint")}</p>
      </div>
    );
  }

  return (
    <div className="catalog-results-table overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="hidden gap-3 bg-brand-brown px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-white lg:grid lg:grid-cols-[100px_minmax(140px,1fr)_minmax(160px,1.2fr)_minmax(180px,1.5fr)_120px_130px] xl:grid-cols-[110px_minmax(180px,1.15fr)_minmax(200px,1.25fr)_minmax(240px,1.6fr)_130px_140px]">
        <span>{t("colProduct")}</span>
        <span>{t("colBesekaRef")}</span>
        <span>{t("colOemOtherRef")}</span>
        <span>{t("colMakeModel")}</span>
        <span>{t("colModelYear")}</span>
        <span className="text-center">{t("listColAction")}</span>
      </div>

      <ul className="divide-y divide-border">
        {products.map((product) => {
          const name = getLocalizedText(product.name, locale);
          const codes = [
            ...(product.oemCodes?.map((c) => c.code) ?? []),
            ...(product.crossCodes?.map((c) => c.code) ?? []),
          ];
          const vehicles = buildVehicleDisplayRows(product);

          return (
            <li
              key={product.id}
              className="grid gap-4 px-4 py-4 lg:grid lg:grid-cols-[100px_minmax(140px,1fr)_minmax(160px,1.2fr)_minmax(180px,1.5fr)_120px_130px] xl:grid-cols-[110px_minmax(180px,1.15fr)_minmax(200px,1.25fr)_minmax(240px,1.6fr)_130px_140px] lg:items-start lg:gap-3"
            >
              <div className="product-image-frame relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded border border-border bg-white lg:mx-0">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={name}
                    fill
                    className="product-image object-contain p-1"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold text-muted">
                    {product.sku.slice(0, 4)}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <span className="inline-block rounded bg-brand-brown px-2 py-0.5 font-mono text-sm font-bold text-white">
                  {product.sku}
                </span>
                {product.isNew && (
                  <Badge variant="new" className="ml-2 align-middle">
                    {tCommon("new")}
                  </Badge>
                )}
                <p className="mt-2 text-sm font-semibold leading-snug text-brand-brown-dark">{name}</p>
              </div>

              <div className="max-h-28 overflow-y-auto font-mono text-xs leading-relaxed text-brand-brown-dark">
                {codes.length ? (
                  codes.map((code) => (
                    <div key={code} className="border-b border-border/60 py-1 last:border-0">
                      {code}
                    </div>
                  ))
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>

              <div className="max-h-28 overflow-y-auto text-xs leading-relaxed text-brand-brown-dark">
                {vehicles.length ? (
                  vehicles.map((row) => (
                    <div key={row.key} className="border-b border-border/60 py-1 last:border-0">
                      {row.makeModel}
                    </div>
                  ))
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>

              <div className="max-h-28 overflow-y-auto text-xs leading-relaxed text-brand-brown-dark">
                {vehicles.length ? (
                  vehicles.map((row) => (
                    <div key={`${row.key}-y`} className="border-b border-border/60 py-1 last:border-0">
                      {row.yearLabel}
                    </div>
                  ))
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>

              <div className="flex flex-col items-center gap-2 lg:pt-2">
                <Link href={`/${locale}/urunler/${product.slug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col gap-1 border-zinc-300 bg-zinc-100 px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-zinc-700 hover:bg-zinc-200"
                  >
                    <Search className="h-4 w-4" />
                    {t("showDetail")}
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  aria-pressed={isSelected(product.id)}
                  aria-label={t("selectForExport")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border-2 transition-colors",
                    isSelected(product.id)
                      ? "border-brand-red bg-brand-red text-white shadow-sm"
                      : "border-zinc-300 bg-white text-transparent hover:border-brand-red/60",
                  )}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border bg-brand-cream-light/40 px-4 py-3 text-center text-xs text-muted">
        <p>{t("resultsDisclaimer")}</p>
        <p className="mt-1 font-medium text-brand-brown-dark">
          {t("resultsShowing", { shown: products.length, total })}
        </p>
      </div>
    </div>
  );
}
