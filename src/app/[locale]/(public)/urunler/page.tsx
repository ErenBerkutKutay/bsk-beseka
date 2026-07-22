import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
import { CatalogExportBar } from "@/components/catalog/catalog-export-bar";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CATALOG_RESULTS_ID, hasActiveCatalogSearch } from "@/lib/catalog/navigation";

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
  const t = await getTranslations("catalog");
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const { products, total, limit } = await searchProducts({
    q: searchParams.q,
    sku: searchParams.sku,
    make: searchParams.make,
    model: searchParams.model,
    engineInfo: searchParams.engineInfo,
    subModel: searchParams.subModel,
    vehicleId: searchParams.vehicleId,
    category: searchParams.category,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isFullCatalog = searchParams.catalog === "1";

  return (
    <div>
      {isFullCatalog && (
        <h1 className="mb-4 text-2xl font-bold text-brand-brown-dark">{t("allProductsTitle")}</h1>
      )}

      <Suspense fallback={<div className="mb-4 h-14 animate-pulse rounded-lg bg-brand-cream" />}>
        <CatalogExportBar total={total} />
      </Suspense>

      <CatalogResultsTable products={products as never[]} total={total} />

      <Suspense fallback={null}>
        <CatalogPagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
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
  const isSearching = hasActiveCatalogSearch(filters);

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
