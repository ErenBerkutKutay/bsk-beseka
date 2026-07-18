"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildCatalogSearchUrl } from "@/lib/catalog/navigation";

type ProductSearchFormProps = {
  variant?: "header" | "hero";
  className?: string;
  onNavigate?: () => void;
};

export function ProductSearchForm({
  variant = "hero",
  className = "",
  onNavigate,
}: ProductSearchFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tCatalog = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [locale]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(buildCatalogSearchUrl(locale, { q }), { scroll: false });
    } else {
      router.push(`/${locale}/urunler`);
    }
    onNavigate?.();
  }

  if (variant === "header") {
    return (
      <form onSubmit={onSubmit} className={className}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/45" />
          <input
            key={locale}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tNav("searchPlaceholder")}
            aria-label={tCatalog("searchAriaLabel")}
            className="w-full rounded-full border border-brand-cream-dark/70 bg-brand-cream-light/40 py-2.5 pl-10 pr-4 text-sm text-brand-brown-dark outline-none transition placeholder:text-muted focus:border-brand-brown/35 focus:bg-white focus:ring-2 focus:ring-brand-brown/15"
          />
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`mx-auto flex max-w-xl flex-col gap-3 sm:flex-row ${className}`}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          key={locale}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tCatalog("generalSearchPlaceholder")}
          aria-label={tCatalog("searchAriaLabel")}
          className="w-full rounded-lg border border-brand-cream-dark/50 bg-white py-3 pl-10 pr-4 text-sm text-brand-brown-dark shadow-md shadow-brand-cream/20 outline-none ring-brand-brown/30 focus:ring-2"
        />
      </div>
      <Button type="submit" size="lg" className="gap-2">
        <Search className="h-4 w-4" />
        {tCommon("search")}
      </Button>
    </form>
  );
}
