import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { searchProducts } from "@/lib/products/search";
import { enrichCategoriesWithImages } from "@/lib/categories/display-image";
import {
  CatalogSearchPanel,
  CatalogSearchSidebar,
  CatalogCategoryTiles,
} from "@/components/catalog/catalog-search-panel";
import { CatalogResultsTable } from "@/components/catalog/catalog-results-table";
import { CatalogScrollToResults } from "@/components/catalog/catalog-scroll-to-results";
import { CATALOG_RESULTS_ID } from "@/lib/catalog/navigation";

function hasActiveSearch(params: Record<string, string | undefined>) {
  return !!(params.q || params.sku || params.make || params.model || params.subModel || params.category);
}

function CatalogResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 animate-pulse rounded bg-brand-cream" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-brand-cream-light" />
      ))}
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
    <CatalogResultsTable
      products={products as never[]}
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

      {isSearching ? (
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div
            id={CATALOG_RESULTS_ID}
            className="grid scroll-mt-28 gap-6 lg:grid-cols-[280px_1fr] lg:items-start"
          >
            <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-brand-cream" />}>
              <CatalogSearchSidebar categories={categories as never[]} />
            </Suspense>
            <div className="min-w-0">
              <Suspense fallback={<CatalogResultsSkeleton />}>
                <CatalogResults locale={locale} searchParams={filters} />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-48 animate-pulse bg-white" />}>
            <CatalogSearchPanel categories={categories as never[]} />
          </Suspense>

          <CatalogCategoryTiles
            categories={categories as never[]}
            activeCategory={filters.category}
          />
        </>
      )}
    </div>
  );
}
