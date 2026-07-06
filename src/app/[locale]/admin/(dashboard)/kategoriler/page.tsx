"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import {
  AdminPreviewModal,
  CategoryPreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";

type Category = {
  id: string;
  slug: string;
  name: { tr: string };
  image?: string | null;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ slug: "", nameTr: "", image: "" });
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

    if (editing) {
      await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          slug: form.slug,
          nameTr: form.nameTr,
          image: form.image,
        }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ slug: "", nameTr: "", image: "" });
    setSaving(false);
    load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Kategoriler</h1>
      <p className="mb-6 text-sm text-muted">Katalogdaki ürün gruplarına görsel ekleyin</p>

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">{editing ? "Kategori Düzenle" : "Yeni Kategori"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label>Ad (TR)</Label>
                <Input
                  value={form.nameTr}
                  onChange={(e) => setForm({ ...form, nameTr: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <ImageUploadField
              label="Kategori Görseli"
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              hint="Katalog kategori kutucuklarında gösterilir"
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
                    setForm({ slug: "", nameTr: "", image: "" });
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
                  nameTr: cat.name.tr,
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
        <CategoryPreview name={form.nameTr} image={form.image} />
      </AdminPreviewModal>
    </div>
  );
}
