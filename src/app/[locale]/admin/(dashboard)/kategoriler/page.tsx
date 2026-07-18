"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import {
  AdminPreviewModal,
  CategoryPreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";

type Category = {
  id: string;
  slug: string;
  name: Record<string, string>;
  image?: string | null;
};

const emptyForm = {
  slug: "",
  name: emptyLocalizedContent(),
  image: "",
};

export default function AdminCategoriesPage() {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/categories");
    setCategories(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      slug: form.slug,
      name: form.name,
      image: form.image,
    };

    if (editing) {
      await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm(emptyForm);
    setSaving(false);
    load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Ürün Grupları</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Ana sayfa ve katalogdaki <strong className="text-brand-brown-dark">Ürün Grupları</strong>{" "}
        kutucuklarında görünen görselleri buradan yönetin. Ürün fotoğraflarından bağımsızdır.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/${locale}/admin/kategoriler/gorseller`}>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Toplu Grup Görseli
          </Button>
        </Link>
      </div>

      <Card className="mb-8 border-brand-cream-dark/50 bg-brand-cream-light/30">
        <CardContent className="pt-6 text-sm text-muted">
          <p className="flex items-center gap-2 font-medium text-brand-brown-dark">
            <ImageIcon className="h-4 w-4" />
            Toplu yükleme dosya adları
          </p>
          <p className="mt-2">
            Her görsel dosyası kategori slug&apos;u ile adlandırılır:{" "}
            <span className="font-mono text-brand-brown">motor-takozlari.jpg</span>,{" "}
            <span className="font-mono text-brand-brown">amortisor-korukleri.jpg</span>
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">{editing ? "Kategori Düzenle" : "Yeni Kategori"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>

            <LocalizedTextFields
              label="Kategori Adı"
              values={form.name}
              onChange={(lang: AppLocale, value) =>
                setForm((prev) => ({
                  ...prev,
                  name: { ...prev.name, [lang]: value },
                }))
              }
              requiredLocale="tr"
            />

            <ImageUploadField
              label="Grup Görseli"
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              hint="Ana sayfa ve katalog Ürün Grupları bölümünde gösterilir"
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Güncelle" : "Ekle"}
              </Button>
              <PreviewButton onClick={() => setPreviewOpen(true)} />
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                >
                  İptal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-3">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-white p-4"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-cream-light">
              {cat.image ? (
                <Image src={cat.image} alt="" fill className="object-cover" sizes="56px" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg">📦</div>
              )}
            </div>
            <div className="flex-1">
              <span className="font-medium text-brand-brown-dark">{cat.name.tr}</span>
              <span className="ml-2 text-sm text-muted">({cat.slug})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(cat);
                setForm({
                  slug: cat.slug,
                  name: parseLocalizedContent(cat.name),
                  image: cat.image || "",
                });
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <AdminPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Kategori Önizlemesi"
      >
        <CategoryPreview name={form.name.tr} image={form.image} />
      </AdminPreviewModal>
    </div>
  );
}
