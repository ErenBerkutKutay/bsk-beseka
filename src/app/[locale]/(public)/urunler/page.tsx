import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { searchProducts } from "@/lib/products/search";
import {
  CatalogSearchPanel,
  CatalogCategoryTiles,
} from "@/components/catalog/catalog-search-panel";
import { CatalogProductList } from "@/components/catalog/product-grid";
import { Search, Wrench, AlignLeft } from "lucide-react";

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

async function CatalogLanding() {
  const t = await getTranslations("catalog");

  const hints = [
    {
      icon: AlignLeft,
      title: "Genel Arama",
      desc: "Ürün adı, açıklama, Beseka kodu ve OEM/cross kodu tek kutuda",
    },
    {
      icon: Wrench,
      title: "OEM / Cross Kod",
      desc: "12 34-56.78 yazsanız da 12345678 olarak eşleşir",
    },
    {
      icon: Search,
      title: "Beseka SKU",
      desc: "B8376, B8306.T gibi referans kodlarla doğrudan arama",
    },
  ];

  return (
    <div className="rounded-2xl border border-brand-cream-dark/40 bg-white p-8 shadow-md shadow-brand-cream/20 md:p-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-cream to-brand-cream-dark shadow-lg shadow-brand-cream/40">
          <Search className="h-9 w-9 text-brand-brown" />
        </div>
        <h2 className="text-xl font-bold text-brand-brown-dark md:text-2xl">
          {t("landingHint")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
          {t("landingSubhint")}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-3">
        {hints.map((hint) => {
          const Icon = hint.icon;
          return (
            <div
              key={hint.title}
              className="catalog-hint-card rounded-xl border p-5 text-center shadow-sm"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-brown text-brand-cream shadow-md">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-brand-brown-dark">{hint.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint.desc}</p>
            </div>
          );
        })}
      </div>
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

  const categories = await db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
  });

  const isSearching = hasActiveSearch(filters);

  return (
    <div className="catalog-page-bg min-h-screen">
      <Suspense fallback={<div className="h-56 animate-pulse bg-brand-brown" />}>
        <CatalogSearchPanel categories={categories as never[]} />
      </Suspense>

      <CatalogCategoryTiles
        categories={categories as never[]}
        activeCategory={filters.category}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {isSearching ? (
          <Suspense fallback={<CatalogResultsSkeleton />}>
            <CatalogResults locale={locale} searchParams={filters} />
          </Suspense>
        ) : (
          <CatalogLanding />
        )}
      </div>
    </div>
  );
}
