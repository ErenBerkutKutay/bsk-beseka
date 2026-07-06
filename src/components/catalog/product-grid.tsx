"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Copy, Check, Eye, LayoutGrid, List, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLocalizedText } from "@/lib/utils";

type ProductResult = {
  id: string;
  sku: string;
  slug: string;
  name: Record<string, string>;
  images: string[];
  isNew: boolean;
  oemCodes?: { code: string }[];
  crossCodes?: { code: string }[];
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded p-0.5 text-muted transition hover:bg-brand-cream-light hover:text-brand-brown"
      title="Kopyala"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function CodePills({
  oemCodes,
  crossCodes,
  max = 3,
}: {
  oemCodes?: { code: string }[];
  crossCodes?: { code: string }[];
  max?: number;
}) {
  const codes = [
    ...(oemCodes?.map((c) => ({ ...c, type: "OEM" })) ?? []),
    ...(crossCodes?.map((c) => ({ ...c, type: "Cross" })) ?? []),
  ].slice(0, max);

  if (!codes.length) return <span className="text-xs text-muted">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {codes.map((c) => (
        <span
          key={`${c.type}-${c.code}`}
          className="inline-flex items-center gap-1 rounded-md bg-brand-cream/50 px-2 py-0.5 font-mono text-[11px] text-brand-brown-dark ring-1 ring-brand-cream-dark/50"
        >
          <span className="text-[9px] font-sans font-semibold uppercase text-muted">{c.type}</span>
          {c.code}
          <CopyButton text={c.code} />
        </span>
      ))}
    </div>
  );
}

function CatalogProductCard({
  product,
  locale,
  onQuickView,
}: {
  product: ProductResult;
  locale: string;
  onQuickView: () => void;
}) {
  const name = getLocalizedText(product.name, locale);

  return (
    <article className="card-hover group flex flex-col overflow-hidden rounded-xl border border-brand-cream-dark/40 bg-white shadow-sm shadow-brand-cream/15 hover:border-brand-brown hover:shadow-lg hover:shadow-brand-brown/20">
      <Link
        href={`/${locale}/urunler/${product.slug}`}
        className="product-image-frame relative block aspect-square"
      >
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            className="product-image"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-lg font-bold text-muted">
            {product.sku}
          </div>
        )}
        {product.isNew && (
          <Badge variant="new" className="absolute left-3 top-3 shadow-sm">
            Yeni
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-brand-brown px-2 py-0.5 font-mono text-sm font-bold text-brand-cream">
            {product.sku}
          </span>
        </div>
        <Link href={`/${locale}/urunler/${product.slug}`}>
          <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-brand-brown-dark transition hover:text-brand-brown">
            {name}
          </h3>
        </Link>
        <div className="mt-3 flex-1">
          <CodePills oemCodes={product.oemCodes} crossCodes={product.crossCodes} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onQuickView}>
            <Eye className="h-3.5 w-3.5" />
            Hızlı Bak
          </Button>
          <Link href={`/${locale}/urunler/${product.slug}`} className="flex-1">
            <Button size="sm" className="w-full">Detay</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CatalogProductList({
  products,
  locale,
  total,
}: {
  products: ProductResult[];
  locale: string;
  total: number;
}) {
  const t = useTranslations("catalog");
  const [quickView, setQuickView] = useState<ProductResult | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-brown/25 bg-white p-12 text-center shadow-sm md:p-16">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream-light">
          <SearchX className="h-8 w-8 text-brand-brown/60" />
        </div>
        <p className="text-lg font-semibold text-brand-brown-dark">{t("noResults")}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Farklı bir OEM kodu formatı deneyin (ör. 12-34-56.78), Beseka SKU girin veya araç
          filtresini genişletin.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <span className="text-2xl font-bold text-brand-brown-dark">{total}</span>
            <span className="ml-1.5">ürün bulundu</span>
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-2 transition ${viewMode === "grid" ? "bg-brand-brown text-brand-cream" : "text-muted hover:bg-brand-cream-light"}`}
            aria-label="Grid görünüm"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md p-2 transition ${viewMode === "list" ? "bg-brand-brown text-brand-cream" : "text-muted hover:bg-brand-cream-light"}`}
            aria-label="Liste görünüm"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              locale={locale}
              onQuickView={() => setQuickView(product)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="hidden grid-cols-[72px_110px_1fr_200px_130px] gap-4 border-b border-brand-cream bg-brand-brown px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-cream lg:grid">
            <span>Görsel</span>
            <span>Ref Kodu</span>
            <span>Ürün Adı</span>
            <span>OEM / Cross</span>
            <span className="text-right">İşlem</span>
          </div>
          <ul className="divide-y divide-border">
            {products.map((product) => {
              const name = getLocalizedText(product.name, locale);
              return (
                <li
                  key={product.id}
                  className="grid gap-3 px-4 py-4 transition hover:bg-brand-cream-light/50 lg:grid-cols-[72px_110px_1fr_200px_130px] lg:items-center lg:gap-4"
                >
                  <div className="product-image-frame relative hidden h-14 w-14 shrink-0 rounded-lg border border-border lg:block">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={name} fill className="product-image" sizes="56px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] font-bold text-muted">
                        {product.sku.slice(0, 4)}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-mono font-bold text-brand-brown">{product.sku}</span>
                    {product.isNew && <Badge variant="new" className="ml-2">Yeni</Badge>}
                  </div>
                  <p className="font-medium leading-snug text-brand-brown-dark">{name}</p>
                  <CodePills oemCodes={product.oemCodes} crossCodes={product.crossCodes} max={2} />
                  <div className="flex gap-2 lg:justify-end">
                    <Button variant="outline" size="sm" onClick={() => setQuickView(product)}>Bak</Button>
                    <Link href={`/${locale}/urunler/${product.slug}`}>
                      <Button size="sm">Detay</Button>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {quickView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-brown-dark/60 p-4 backdrop-blur-sm"
          onClick={() => setQuickView(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg animate-[fade-up_0.3s_ease-out] overflow-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="product-image-frame relative aspect-square max-h-[320px] w-full">
              {quickView.images[0] ? (
                <Image
                  src={quickView.images[0]}
                  alt={getLocalizedText(quickView.name, locale)}
                  fill
                  className="product-image"
                  sizes="512px"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-2xl font-bold text-muted">
                  {quickView.sku}
                </div>
              )}
              {quickView.isNew && (
                <Badge variant="new" className="absolute left-4 top-4">Yeni</Badge>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-md bg-brand-brown px-2.5 py-1 font-mono text-sm font-bold text-brand-cream">
                    {quickView.sku}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-brand-brown-dark">
                    {getLocalizedText(quickView.name, locale)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickView(null)}
                  className="rounded-full p-2 text-muted transition hover:bg-brand-cream-light"
                >
                  ✕
                </button>
              </div>

              {quickView.oemCodes && quickView.oemCodes.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">OEM Kodları</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickView.oemCodes.map((c) => (
                      <span
                        key={c.code}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cream-light px-3 py-1.5 font-mono text-sm text-brand-brown-dark ring-1 ring-brand-cream"
                      >
                        {c.code}
                        <CopyButton text={c.code} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {quickView.crossCodes && quickView.crossCodes.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Cross Kodları</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickView.crossCodes.map((c) => (
                      <span
                        key={c.code}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cream-light px-3 py-1.5 font-mono text-sm text-brand-brown-dark ring-1 ring-brand-cream"
                      >
                        {c.code}
                        <CopyButton text={c.code} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link href={`/${locale}/urunler/${quickView.slug}`} className="mt-6 block">
                <Button className="w-full" size="lg">Ürün Detayına Git</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function NewProductCard({
  product,
  locale,
  className,
}: {
  product: ProductResult;
  locale: string;
  className?: string;
}) {
  const name = getLocalizedText(product.name, locale);

  return (
    <Link
      href={`/${locale}/urunler/${product.slug}`}
      className={`card-hover group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:border-brand-brown hover:shadow-lg ${className ?? ""}`}
    >
      <div className="product-image-frame relative aspect-square">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            className="product-image"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-muted">
            {product.sku}
          </div>
        )}
        <Badge variant="new" className="absolute left-3 top-3 shadow-sm">
          Yeni
        </Badge>
      </div>
      <div className="p-4">
        <div className="font-semibold text-brand-brown">{product.sku}</div>
        <div className="mt-1 line-clamp-2 font-medium leading-snug text-brand-brown-dark">
          {name}
        </div>
      </div>
    </Link>
  );
}

export function NewProductsCarousel({
  products,
}: {
  products: ProductResult[];
}) {
  const locale = useLocale();

  if (!products.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
      {products.map((product) => (
        <NewProductCard
          key={product.id}
          product={product}
          locale={locale}
          className="min-w-[240px] max-w-[280px] shrink-0 snap-start sm:min-w-[260px]"
        />
      ))}
    </div>
  );
}

export function NewProductsGrid({
  products,
  locale,
}: {
  products: ProductResult[];
  locale: string;
}) {
  if (!products.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-brand-cream-light/50 py-16 text-center text-muted">
        Henüz yeni ürün bulunmuyor.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product) => (
        <NewProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}

// Geriye dönük uyumluluk
export function ProductGrid({
  initialProducts,
  locale,
}: {
  initialProducts: ProductResult[];
  locale: string;
}) {
  return (
    <CatalogProductList
      products={initialProducts}
      locale={locale}
      total={initialProducts.length}
    />
  );
}
