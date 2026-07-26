"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getLocalizedText } from "@/lib/utils";

export type RelatedCategoryProduct = {
  id: string;
  sku: string;
  slug: string;
  name: Record<string, string>;
  images: string[];
};

function RelatedProductCard({
  product,
  locale,
}: {
  product: RelatedCategoryProduct;
  locale: string;
}) {
  const name = getLocalizedText(product.name, locale);

  return (
    <Link
      href={`/${locale}/urunler/${product.slug}`}
      className="group flex h-[290px] w-[190px] shrink-0 snap-start flex-col overflow-hidden rounded-sm border border-zinc-300 bg-white transition hover:border-brand-brown hover:shadow-md sm:w-[210px] md:w-[230px]"
    >
      <div className="px-3 pb-2 pt-3">
        <span className="inline-block rounded-sm bg-brand-brown px-2 py-0.5 font-mono text-xs font-bold text-white">
          {product.sku}
        </span>
        <p className="mt-2 line-clamp-3 text-left text-sm leading-snug text-brand-brown-dark">
          {name}
        </p>
      </div>
      <div className="product-image-frame relative mt-auto min-h-[150px] flex-1 border-t border-zinc-200 bg-white">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            className="product-image object-contain p-3"
            sizes="230px"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-sm font-bold text-muted">
            {product.sku}
          </div>
        )}
      </div>
    </Link>
  );
}

export function CategoryRelatedProducts({
  products,
  locale,
}: {
  products: RelatedCategoryProduct[];
  locale: string;
}) {
  const t = useTranslations("product");

  if (!products.length) return null;

  return (
    <section className="mt-14 border-t border-border bg-zinc-50/80 py-10">
      <div className="mx-auto w-full max-w-screen-2xl px-3 md:px-5 lg:px-6">
        <h2 className="text-lg font-bold text-brand-brown-dark md:text-xl">{t("relatedInCategory")}</h2>
        <div className="-mx-1 mt-6 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory md:gap-4">
          {products.map((product) => (
            <RelatedProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
