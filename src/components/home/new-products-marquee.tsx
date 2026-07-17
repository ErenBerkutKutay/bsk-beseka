"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";

type MarqueeProduct = {
  id: string;
  sku: string;
  slug: string;
  name: Record<string, string>;
  images: string[];
};

export function NewProductsMarquee({ products }: { products: MarqueeProduct[] }) {
  const locale = useLocale();

  if (!products.length) return null;

  const items = [...products, ...products];

  return (
    <section
      className="new-products-marquee group relative overflow-hidden border-b border-border bg-white pt-5 md:pt-6"
      aria-labelledby="yeni-urunlerimiz-baslik"
    >
      <h2 id="yeni-urunlerimiz-baslik" className="mb-4 text-center md:mb-5">
        <Link
          href={`/${locale}/yeni-urunler`}
          className="group/title inline-flex items-center gap-2 text-base font-black uppercase tracking-[0.12em] text-brand-brown-dark transition hover:text-brand-brown md:text-lg"
        >
          Yeni Ürünlerimiz
          <ArrowRight className="h-5 w-5 transition-transform group-hover/title:translate-x-1" aria-hidden />
          <span className="sr-only">— tüm yeni ürünleri görüntüle</span>
        </Link>
      </h2>

      <div className="relative overflow-hidden pb-5 md:pb-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-24" />

      <div className="new-products-marquee-track flex w-max gap-4 px-4 md:gap-5 md:px-6">
        {items.map((product, index) => {
          const name = getLocalizedText(product.name, locale);
          return (
            <Link
              key={`${product.id}-${index}`}
              href={`/${locale}/urunler/${product.slug}`}
              className="card-hover flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:border-brand-brown sm:w-[220px] md:w-[240px]"
            >
              <div className="product-image-frame relative aspect-[4/3] bg-brand-cream-light/40">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={name}
                    fill
                    className="product-image p-2"
                    sizes="240px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-sm font-bold text-muted">
                    {product.sku}
                  </div>
                )}
                <Badge variant="new" className="absolute left-2 top-2 text-[10px] shadow-sm">
                  Yeni
                </Badge>
              </div>
              <div className="border-t border-border p-3">
                <div className="font-mono text-xs font-bold text-brand-brown">{product.sku}</div>
                <div className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-brand-brown-dark">
                  {name}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </section>
  );
}
