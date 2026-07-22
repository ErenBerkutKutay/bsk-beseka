"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Card, CardContent } from "@/components/ui/input";
import {
  AdminPreviewModal,
  ProductPreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";
import {
  VehicleCrossPicker,
  type SelectedVehicleLink,
} from "@/components/admin/vehicle-cross-picker";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";

type Category = { id: string; slug: string; name: { tr: string } };

export default function ProductFormPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const routeId = params.id;
  const productId = routeId && routeId !== "yeni" ? routeId : null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skuError, setSkuError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<SelectedVehicleLink[]>([]);
  const [form, setForm] = useState({
    sku: "",
    name: emptyLocalizedContent(),
    description: emptyLocalizedContent(),
    categoryId: "",
    weightKg: "",
    gtip: "",
    images: "",
    isNew: false,
    isFeatured: false,
    isActive: true,
    oemCodes: "",
    crossCodes: "",
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then(setCategories);

    if (productId) {
      setLoading(true);

      fetch(`/api/admin/products/${productId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((product) => {
          setForm({
            sku: product.sku,
            name: parseLocalizedContent(product.name),
            description: parseLocalizedContent(product.description),
            categoryId: product.categoryId,
            weightKg: product.weightKg != null ? String(product.weightKg) : "",
            gtip: product.gtip || "",
            images: product.images.join("\n"),
            isNew: product.isNew,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            oemCodes: product.oemCodes.map((c: { code: string }) => c.code).join("\n"),
            crossCodes: product.crossCodes.map((c: { code: string }) => c.code).join("\n"),
          });
        })
        .catch(() => setError("Ürün yüklenemedi."));

      fetch(`/api/admin/products/${productId}/vehicle-types`)
        .then((res) => (res.ok ? res.json() : []))
        .then((links: { vehicleType: SelectedVehicleLink }[]) => {
          setSelectedVehicles(
            links.map((link) => ({
              tipNo: link.vehicleType.tipNo,
              make: link.vehicleType.make,
              modelSeries: link.vehicleType.modelSeries,
              typeName: link.vehicleType.typeName,
              yearFrom: link.vehicleType.yearFrom,
              yearTo: link.vehicleType.yearTo,
              fuelType: link.vehicleType.fuelType,
            })),
          );
        })
        .catch(() => setSelectedVehicles([]))
        .finally(() => setLoading(false));
    }
  }, [productId]);

  const imageUrls = form.images
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      setError("Görsel yüklenemedi.");
      return;
    }
    const media = await res.json();
    setForm((prev) => ({
      ...prev,
      images: prev.images ? `${prev.images}\n${media.url}` : media.url,
    }));
  }

  async function checkSkuAvailability(nextSku: string) {
    const sku = nextSku.trim().toUpperCase();
    if (!sku) {
      setSkuError("");
      return true;
    }

    const params = new URLSearchParams({ sku });
    if (productId) params.set("excludeId", productId);

    const res = await fetch(`/api/admin/products/check-sku?${params.toString()}`);
    if (!res.ok) return true;

    const data = await res.json();
    if (!data.available) {
      setSkuError(`Bu Ref zaten kayıtlı: ${sku}`);
      return false;
    }

    setSkuError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const skuOk = await checkSkuAvailability(form.sku);
    if (!skuOk) {
      setError("Bu ürün kodu zaten kullanılıyor. Farklı bir Ref girin veya mevcut ürünü düzenleyin.");
      return;
    }

    setSaving(true);

    const payload = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      weightKg: form.weightKg,
      gtip: form.gtip,
      images: imageUrls,
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      oemCodes: form.oemCodes,
      crossCodes: form.crossCodes,
    };

    const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = productId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kayıt başarısız");
      }

      const saved = await res.json();

      await fetch(`/api/admin/products/${saved.id}/vehicle-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipNos: selectedVehicles.map((item) => item.tipNo),
          replace: true,
        }),
      });

      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/admin/urunler`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-brown" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/${locale}/admin/urunler`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-brown"
      >
        <ArrowLeft className="h-4 w-4" />
        Ürünlere dön
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-brand-brown-dark">
        {productId ? "Ürün Düzenle" : "Yeni Ürün"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Temel bilgiler */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold text-brand-brown-dark">Temel Bilgiler</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Beseka Ref</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => {
                    setForm({ ...form, sku: e.target.value.toUpperCase() });
                    if (skuError) setSkuError("");
                  }}
                  onBlur={(e) => checkSkuAvailability(e.target.value)}
                  placeholder="B8376"
                  className="mt-1.5 font-mono"
                  required
                />
                {skuError && (
                  <p className="mt-1.5 text-sm text-red-600">{skuError}</p>
                )}
              </div>
              <div>
                <Label>Kategori</Label>
                <select
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.tr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <LocalizedTextFields
              label="Ürün Adı"
              values={form.name}
              onChange={(locale, value) =>
                setForm((prev) => ({
                  ...prev,
                  name: { ...prev.name, [locale]: value },
                }))
              }
              requiredLocale="tr"
            />

            <LocalizedTextFields
              label="Açıklama"
              values={form.description}
              onChange={(locale: AppLocale, value) =>
                setForm((prev) => ({
                  ...prev,
                  description: { ...prev.description, [locale]: value },
                }))
              }
              multiline
              rows={4}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Ağırlık (kg)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                  placeholder="1.25"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>GTIP Numarası</Label>
                <Input
                  value={form.gtip}
                  onChange={(e) => setForm({ ...form, gtip: e.target.value })}
                  placeholder="8708.99.00"
                  className="mt-1.5 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                  className="rounded"
                />
                Yeni ürün
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded"
                />
                Sitede aktif
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Kodlar */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold text-brand-brown-dark">OEM & Cross Kodları</h2>
            <p className="text-xs text-muted">
              Her satıra bir kod yazın. Tire, boşluk ve nokta otomatik normalize edilir.
            </p>
            <div>
              <Label>OEM Kodları</Label>
              <Textarea
                value={form.oemCodes}
                onChange={(e) => setForm({ ...form, oemCodes: e.target.value })}
                placeholder={"12 34-56.78\n77 888-99"}
                rows={5}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <div>
              <Label>Cross Kodları</Label>
              <Textarea
                value={form.crossCodes}
                onChange={(e) => setForm({ ...form, crossCodes: e.target.value })}
                rows={4}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Görseller */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold text-brand-brown-dark">Görseller</h2>
            <p className="text-xs text-muted">
              Toplu yüklemeden gelen ürünlerde görsel yoktur. Aşağıdan dosya seçerek yükleyin;
              kaydettiğinizde sitede görünür.
            </p>
            <div>
              <Label>Görsel yükle</Label>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-brand-cream-light/50 px-4 py-3 text-sm text-muted transition hover:border-brand-brown hover:bg-brand-cream-light">
                <Upload className="h-4 w-4" />
                Görsel seç...
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="product-image-frame relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                  >
                    <Image src={url} alt="" fill className="product-image" sizes="80px" />
                  </div>
                ))}
              </div>
            )}
            <details className="text-xs text-muted">
              <summary className="cursor-pointer font-medium text-brand-brown-dark">
                Gelişmiş: URL ile ekle
              </summary>
              <div className="mt-2">
                <Label>Görsel URL&apos;leri (her satıra bir tane)</Label>
                <Textarea
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  rows={2}
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Id crosslama */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold text-brand-brown-dark">Araç Crosslama</h2>
            <p className="text-xs text-muted">
              Marka, model ve motor bilgisini seçerek ürüne bağlayın. Seçili araçların Id değerleri
              kayıt sırasında ürüne crosslanır.
            </p>
            <VehicleCrossPicker
              selected={selectedVehicles}
              onChange={setSelectedVehicles}
            />
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Kaydedildi! Yönlendiriliyorsunuz...
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
          <PreviewButton onClick={() => setPreviewOpen(true)} />
          <Link href={`/${locale}/admin/urunler`}>
            <Button type="button" variant="outline" size="lg">
              İptal
            </Button>
          </Link>
        </div>
      </form>

      <AdminPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Ürün Önizlemesi"
      >
        <ProductPreview
          sku={form.sku}
          name={form.name.tr}
          description={form.description.tr}
          weightKg={form.weightKg}
          gtip={form.gtip}
          images={imageUrls}
          oemCodes={form.oemCodes}
          crossCodes={form.crossCodes}
          isNew={form.isNew}
        />
      </AdminPreviewModal>
    </div>
  );
}
