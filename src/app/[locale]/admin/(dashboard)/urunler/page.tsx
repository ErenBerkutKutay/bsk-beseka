"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Package, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, Input } from "@/components/ui/input";

type Product = {
  id: string;
  sku: string;
  name: { tr: string };
  images: string[];
  isNew: boolean;
  isActive: boolean;
  _count: { oemCodes: number; crossCodes: number; fitments: number };
};

export default function AdminProductsPage() {
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.tr?.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown-dark">Ürünler</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} ürün · SKU, OEM kodları ve görselleri düzenleyin
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/admin/urunler/yeni`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Ürün
            </Button>
          </Link>
          <Link href={`/${locale}/admin/urunler/toplu`}>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Toplu Yükle
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SKU veya ürün adı ara..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-brand-cream-light" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Package className="mb-3 h-10 w-10 text-muted" />
            <p className="font-medium text-brand-brown-dark">
              {query ? "Arama sonucu bulunamadı" : "Henüz ürün yok"}
            </p>
            {!query && (
              <Link href={`/${locale}/admin/urunler/yeni`} className="mt-4">
                <Button>İlk Ürünü Ekle</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <Card key={product.id} className="overflow-hidden transition hover:shadow-md">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="product-image-frame relative h-16 w-16 shrink-0 rounded-lg border border-border">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.sku}
                      fill
                      className="product-image"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-bold text-muted">
                      {product.sku.slice(0, 4)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-brand-brown">{product.sku}</span>
                    {product.isNew && <Badge variant="new">Yeni</Badge>}
                    {!product.isActive && (
                      <Badge variant="outline" className="text-muted">
                        Pasif
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-medium text-brand-brown-dark">
                    {product.name.tr}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    OEM: {product._count.oemCodes} · Cross: {product._count.crossCodes} · Araç:{" "}
                    {product._count.fitments}
                  </p>
                </div>

                <Link href={`/${locale}/admin/urunler/${product.id}`}>
                  <Button variant="outline" size="sm">
                    Düzenle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
