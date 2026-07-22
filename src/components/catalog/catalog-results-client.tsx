"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogExportBar } from "@/components/catalog/catalog-export-bar";
import {
  CatalogResultsTable,
  type CatalogResultProduct,
} from "@/components/catalog/catalog-results-table";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogSelectionProvider } from "@/components/catalog/catalog-selection-context";

export function CatalogResultsClient({
  products,
  total,
  page,
  totalPages,
}: {
  products: CatalogResultProduct[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const resetKey = searchParams.toString();

  return (
    <CatalogSelectionProvider resetKey={resetKey}>
      <Suspense fallback={<div className="mb-4 h-14 animate-pulse rounded-lg bg-brand-cream" />}>
        <CatalogExportBar total={total} />
      </Suspense>

      <CatalogResultsTable products={products} total={total} />

      <Suspense fallback={null}>
        <CatalogPagination page={page} totalPages={totalPages} />
      </Suspense>
    </CatalogSelectionProvider>
  );
}
