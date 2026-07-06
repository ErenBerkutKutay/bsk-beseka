"use client";

import Image from "next/image";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CmsPageContent } from "@/components/cms/page-content";
import { Badge } from "@/components/ui/input";

export function AdminPreviewModal({
  open,
  onClose,
  title = "Önizleme",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-brown-dark/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-brand-brown px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-cream" />
            <span className="font-semibold">{title}</span>
            <span className="rounded-full bg-brand-cream/20 px-2 py-0.5 text-xs text-brand-cream">
              Site önizlemesi
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-white/10"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto bg-[#fffaf6]">{children}</div>
      </div>
    </div>
  );
}

export function BlogPreview({
  title,
  excerpt,
  content,
  coverImage,
}: {
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
}) {
  const html = /<[a-z][\s\S]*>/i.test(content) ? content : content.replace(/\n/g, "<br/>");

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {coverImage && (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl bg-brand-cream-light shadow-md">
          <Image src={coverImage} alt="" fill className="object-cover" sizes="768px" />
        </div>
      )}
      <h1 className="text-2xl font-bold text-brand-brown-dark md:text-3xl">
        {title || "Başlıksız yazı"}
      </h1>
      {excerpt && <p className="mt-3 text-muted">{excerpt}</p>}
      <div className="prose-content mt-6" dangerouslySetInnerHTML={{ __html: html || "<p>İçerik henüz girilmedi.</p>" }} />
    </article>
  );
}

export function ProductPreview({
  sku,
  name,
  description,
  images,
  oemCodes,
  crossCodes,
  isNew,
}: {
  sku: string;
  name: string;
  description?: string;
  images: string[];
  oemCodes: string;
  crossCodes: string;
  isNew: boolean;
}) {
  const oemList = oemCodes.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const crossList = crossCodes.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
        Ürün detay sayfası önizlemesi
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="product-image-frame relative aspect-square overflow-hidden rounded-2xl shadow-md">
          {images[0] ? (
            <Image src={images[0]} alt="" fill className="product-image" sizes="400px" />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-2xl text-muted">
              {sku || "SKU"}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-brown px-3 py-1 font-mono text-sm font-bold text-brand-cream">
              {sku || "—"}
            </span>
            {isNew && <Badge variant="new">Yeni</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-brand-brown-dark">
            {name || "Ürün adı"}
          </h1>
          {description && <p className="mt-4 text-muted">{description}</p>}
          {oemList.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold text-brand-brown-dark">OEM Kodları</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {oemList.map((code) => (
                  <span
                    key={code}
                    className="rounded-md bg-brand-cream-light px-3 py-1 font-mono text-sm ring-1 ring-brand-cream"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
          {crossList.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-bold text-brand-brown-dark">Cross Kodları</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {crossList.map((code) => (
                  <span
                    key={code}
                    className="rounded-md bg-brand-cream-light px-3 py-1 font-mono text-sm ring-1 ring-brand-cream"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {images.length > 1 && (
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {images.slice(1).map((src) => (
            <div key={src} className="product-image-frame relative h-16 w-16 shrink-0 rounded-lg border">
              <Image src={src} alt="" fill className="product-image" sizes="64px" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryPreview({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  return (
    <div className="px-4 py-8">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
        Katalog kategori kutucuğu önizlemesi
      </p>
      <div className="mx-auto max-w-[200px]">
        <div className="card-hover flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 text-center shadow-sm">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-brand-cream-light">
            {image ? (
              <Image src={image} alt="" fill className="object-cover" sizes="48px" />
            ) : (
              <span className="flex h-full items-center justify-center text-2xl">📦</span>
            )}
          </div>
          <span className="text-xs font-semibold text-brand-brown-dark">
            {name || "Kategori adı"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PreviewButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled} className="gap-2">
      <Eye className="h-4 w-4" />
      Önizle
    </Button>
  );
}

export function PagePreview(props: {
  title: string;
  content: string;
  heroImage?: string;
  images?: string[];
}) {
  return (
    <CmsPageContent
      title={props.title || "Sayfa başlığı"}
      content={props.content}
      heroImage={props.heroImage}
      images={props.images}
    />
  );
}
