import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { searchProducts } from "@/lib/products/search";
import { enrichCategoriesWithImages } from "@/lib/categories/display-image";
import {
  CatalogSearchPanel,
  CatalogCategoryTiles,
} from "@/components/catalog/catalog-search-panel";
import { CatalogProductList } from "@/components/catalog/product-grid";
import { CatalogScrollToResults } from "@/components/catalog/catalog-scroll-to-results";
import { CATALOG_RESULTS_ID } from "@/lib/catalog/navigation";

function hasActiveSearch(params: Record<string, string | undefined>) {
  return !!(params.q || params.sku || params.make || params.model || params.subModel || params.category);
}

function CatalogResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-cream" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="aspect-[4/3] animate-pulse bg-brand-cream-light" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-20 animate-pulse rounded bg-brand-cream-light" />
              <div className="h-4 w-full animate-pulse rounded bg-brand-cream-light" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-brand-cream-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function CatalogResults({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Record<string, string | undefined>;
}) {
  const { products, total } = await searchProducts({
    q: searchParams.q,
    sku: searchParams.sku,
    make: searchParams.make,
    model: searchParams.model,
    subModel: searchParams.subModel,
    category: searchParams.category,
  });

  return (
    <CatalogProductList
      products={products as never[]}
      locale={locale}
      total={total}
    />
  );
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);

  const categoriesRaw = await db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
  });

  const categories = enrichCategoriesWithImages(categoriesRaw);

  const isSearching = hasActiveSearch(filters);

  return (
    <div className="catalog-page-bg min-h-screen">
      <Suspense fallback={null}>
        <CatalogScrollToResults />
      </Suspense>

      <Suspense fallback={<div className="h-56 animate-pulse bg-brand-brown" />}>
        <CatalogSearchPanel categories={categories as never[]} />
      </Suspense>

      <CatalogCategoryTiles
        categories={categories as never[]}
        activeCategory={filters.category}
      />

      {isSearching ? (
        <div
          id={CATALOG_RESULTS_ID}
          className="mx-auto max-w-7xl scroll-mt-28 px-4 py-8 md:py-10"
        >
          <Suspense fallback={<CatalogResultsSkeleton />}>
            <CatalogResults locale={locale} searchParams={filters} />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
