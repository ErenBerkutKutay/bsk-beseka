"use client";

import { ProductSearchForm } from "@/components/catalog/product-search-form";

export function HomeCatalogSearch() {
  return (
    <section className="catalog-home-search border-y py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand-brown">
          Online Katalog
        </p>
        <h2 className="mt-2 text-2xl font-bold text-brand-brown-dark md:text-3xl">
          Ürün adı, kod veya OEM ile arayın
        </h2>
        <p className="mt-2 text-sm text-muted">
          motor takozu, B8376, 1311 826 080 — açıklama, Beseka kodu ve OEM/cross kodu aynı kutuda aranır.
        </p>

        <div className="mt-8">
          <ProductSearchForm variant="hero" />
        </div>
      </div>
    </section>
  );
}
