"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";

type HomeBanner = {
  id: string;
  title: string | null;
  image: string;
  href: string | null;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  image: "",
  href: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    const res = await fetch("/api/admin/banners");
    if (!res.ok) {
      setLoadError("Banner listesi yüklenemedi. Oturum açık olduğundan emin olun.");
      setBanners([]);
      return;
    }
    const data = await res.json();
    setBanners(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(banner: HomeBanner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      image: banner.image,
      href: banner.href || "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image) return;

    setSaving(true);
    setSaveError(null);

    const payload = {
      title: form.title || undefined,
      image: form.image,
      href: form.href || undefined,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };

    const res = editingId
      ? await fetch(`/api/admin/banners/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setSaveError(data?.error || "Banner kaydedilemedi. Lütfen tekrar deneyin.");
      setSaving(false);
      return;
    }

    setSaving(false);
    cancelEdit();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu banner silinsin mi?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Ana Sayfa Bannerları</h1>
      <p className="mb-6 text-sm text-muted">
        Önerilen boyut: 1920 × 900 px (2:1), en fazla 4 MB. Metin ve logo ortada kalsın; alt şerit
        (iletişim, sertifikalar) görselin içinde tasarlanmalıdır.
      </p>

      {(loadError || saveError) && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError || saveError}
        </p>
      )}

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-semibold text-brand-brown-dark">
              {editingId ? "Banner Düzenle" : "Yeni Banner Ekle"}
            </h2>

            <ImageUploadField
              label="Banner Görseli"
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              uploadFolder="beseka/banners"
              hint="Canlıda /api/media/... adresiyle sunulur; yerelde public/beseka/banners/ altına kaydedilir."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Başlık (alt metin)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5"
                  placeholder="Beseka — Yeni ürünler"
                />
              </div>
              <div>
                <Label>Link (isteğe bağlı)</Label>
                <Input
                  value={form.href}
                  onChange={(e) => setForm({ ...form, href: e.target.value })}
                  className="mt-1.5"
                  placeholder="/urunler"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="mt-1.5"
                  min={0}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-brand-brown"
                  />
                  Yayında
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || !form.image}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Güncelle" : "Banner Ekle"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-3">
        {banners.map((banner) => (
          <li
            key={banner.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-white p-4"
          >
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-brand-cream-light">
              <Image src={banner.image} alt="" fill className="object-cover" sizes="112px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-brand-brown-dark">
                {banner.title || "Başlıksız banner"}
              </p>
              <p className="text-sm text-muted">
                Sıra: {banner.sortOrder}
                {banner.href ? ` · ${banner.href}` : ""}
                {!banner.isActive && " · Pasif"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(banner)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(banner.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </li>
        ))}
        {!banners.length && !loadError && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted">
            Henüz banner yok. Yukarıdan yeni banner ekleyin veya{" "}
            <code className="rounded bg-brand-cream-light px-1.5 py-0.5">npm run db:seed</code>{" "}
            ile varsayılan bannerları yükleyin.
          </p>
        )}
      </ul>
    </div>
  );
}
