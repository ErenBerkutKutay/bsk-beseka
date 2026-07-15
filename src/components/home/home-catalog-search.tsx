"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeCatalogSearch() {
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push(`/${locale}/urunler`);
      return;
    }
    router.push(`/${locale}/urunler?q=${encodeURIComponent(q)}`);
  }

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

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Örn: motor takozu, B8376, 1311 826 080"
              className="w-full rounded-lg border border-brand-cream-dark/50 bg-white py-3 pl-10 pr-4 text-sm text-brand-brown-dark shadow-md shadow-brand-cream/20 outline-none ring-brand-brown/30 focus:ring-2"
            />
          </div>
          <Button type="submit" size="lg" className="gap-2">
            <Search className="h-4 w-4" />
            Ara
          </Button>
        </form>
      </div>
    </section>
  );
}
