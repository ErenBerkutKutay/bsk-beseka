"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLocalizedText } from "@/lib/utils";

type ShowcaseProduct = {
  id: string;
  sku: string;
  slug: string;
  name: Record<string, string>;
  images: string[];
  isNew: boolean;
};

const INTERVAL_MS = 5000;

export function NewProductsShowcase({ products }: { products: ShowcaseProduct[] }) {
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => setActive((index + products.length) % products.length),
    [products.length],
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused || products.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % products.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, products.length]);

  if (!products.length) return null;

  const product = products[active];
  const name = getLocalizedText(product.name, locale);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Yeni ürünler"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="grid items-stretch md:grid-cols-2">
          <div className="relative flex min-h-[280px] items-center justify-center bg-gradient-to-b from-white to-brand-cream-light/60 p-6 md:min-h-[360px]">
            <div className="relative h-[220px] w-full md:h-[300px]">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={name}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-2xl font-bold text-muted">
                  {product.sku}
                </div>
              )}
            </div>
            <Badge variant="new" className="absolute left-4 top-4 z-10 shadow-sm">
              Yeni
            </Badge>
          </div>

          <div className="flex flex-col justify-center p-6 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-brown-mid">
              Yeni Ürün
            </p>
            <span className="mt-3 inline-flex w-fit rounded-md bg-brand-brown px-3 py-1 font-mono text-sm font-bold text-brand-cream">
              {product.sku}
            </span>
            <h3 className="mt-4 text-xl font-bold leading-snug text-brand-brown-dark md:text-2xl">
              {name}
            </h3>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/urunler/${product.slug}`}>
                <Button size="lg">Ürün Detayı</Button>
              </Link>
              <Link href={`/${locale}/yeni-urunler`}>
                <Button variant="outline" size="lg">
                  Tüm Yeni Ürünler
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Önceki ürün"
            className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-brand-brown-dark shadow-md transition hover:bg-brand-brown hover:text-white md:-left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Sonraki ürün"
            className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-brand-brown-dark shadow-md transition hover:bg-brand-brown hover:text-white md:-right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-5 flex items-center justify-center gap-2">
            {products.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ürün ${index + 1}: ${item.sku}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === active
                    ? "w-8 bg-brand-brown"
                    : "w-2 bg-brand-brown/25 hover:bg-brand-brown/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
