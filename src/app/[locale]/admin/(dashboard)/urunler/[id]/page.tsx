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
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    nameTr: "",
    nameEn: "",
    descriptionTr: "",
    categoryId: "",
    images: "",
    isNew: false,
    isFeatured: false,
    isActive: true,
    oemCodes: "",
    crossCodes: "",
    fitmentsBulk: "",
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then(setCategories);

    if (productId) {
      fetch(`/api/admin/products/${productId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((product) => {
          setForm({
            sku: product.sku,
            nameTr: product.name.tr || "",
            nameEn: product.name.en || "",
            descriptionTr: product.description?.tr || "",
            categoryId: product.categoryId,
            images: product.images.join("\n"),
            isNew: product.isNew,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            oemCodes: product.oemCodes.map((c: { code: string }) => c.code).join("\n"),
            crossCodes: product.crossCodes.map((c: { code: string }) => c.code).join("\n"),
            fitmentsBulk: "",
          });
        })
        .catch(() => setError("Ürün yüklenemedi."))
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const payload = {
      ...form,
      images: imageUrls,
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

      if (form.fitmentsBulk.trim()) {
        await fetch(`/api/admin/products/${saved.id}/fitments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: form.fitmentsBulk }),
        });
      }

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
                <Label>SKU (Beseka Ref.)</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  placeholder="B8376"
                  className="mt-1.5 font-mono"
                  required
                />
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

            <div>
              <Label>Ürün Adı (TR)</Label>
              <Input
                value={form.nameTr}
                onChange={(e) => setForm({ ...form, nameTr: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label>Açıklama (TR)</Label>
              <Textarea
                value={form.descriptionTr}
                onChange={(e) => setForm({ ...form, descriptionTr: e.target.value })}
                rows={3}
                className="mt-1.5"
              />
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
            <div>
              <Label>Görsel URL&apos;leri (her satıra bir tane)</Label>
              <Textarea
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                rows={2}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <div>
              <Label>Dosya yükle</Label>
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
          </CardContent>
        </Card>

        {/* Araç uyumluluk */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-semibold text-brand-brown-dark">Araç Uyumluluğu</h2>
            <p className="text-xs text-muted">
              CSV formatı: marka;model;altModel;yılBaş;yılBit;motor
            </p>
            <Textarea
              value={form.fitmentsBulk}
              onChange={(e) => setForm({ ...form, fitmentsBulk: e.target.value })}
              placeholder={"Renault;Clio;IV;2012;2019;1.5 dCi"}
              rows={4}
              className="font-mono text-sm"
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
          name={form.nameTr}
          description={form.descriptionTr}
          images={imageUrls}
          oemCodes={form.oemCodes}
          crossCodes={form.crossCodes}
          isNew={form.isNew}
        />
      </AdminPreviewModal>
    </div>
  );
}
