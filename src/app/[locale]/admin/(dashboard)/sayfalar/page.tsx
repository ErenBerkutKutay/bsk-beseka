"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";
import {
  ImageGalleryField,
  ImageUploadField,
  RichContentEditor,
} from "@/components/admin/image-upload";
import {
  AdminPreviewModal,
  PagePreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";

type Page = {
  id: string;
  slug: string;
  title: { tr: string };
  content: { tr: string };
  heroImage?: string | null;
  images: string[];
};

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selected, setSelected] = useState<Page | null>(null);
  const [contentTr, setContentTr] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/pages");
    setPages(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function selectPage(page: Page) {
    setSelected(page);
    setContentTr(page.content.tr || "");
    setHeroImage(page.heroImage || "");
    setImages(page.images || []);
    setSaved(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaved(false);

    await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        titleTr: selected.title.tr,
        contentTr,
        heroImage,
        images,
        isActive: true,
        sortOrder: 0,
      }),
    });

    setSaving(false);
    setSaved(true);
    load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Kurumsal & Üretim Sayfaları</h1>
      <p className="mb-6 text-sm text-muted">
        Her sayfaya kapak görseli, galeri ve içerik görselleri ekleyebilirsiniz
      </p>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-2">
          {pages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => selectPage(page)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  selected?.id === page.id
                    ? "border-brand-brown bg-brand-cream-light font-medium text-brand-brown-dark"
                    : "border-border bg-white hover:border-brand-cream"
                }`}
              >
                {getLocalizedText(page.title, "tr")}
                {(page.heroImage || page.images?.length > 0) && (
                  <span className="mt-1 block text-xs text-muted">📷 Görsel var</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <Card>
            <CardContent className="space-y-5 pt-6">
              <h2 className="text-lg font-bold text-brand-brown-dark">{selected.title.tr}</h2>

              <ImageUploadField
                label="Kapak / Hero Görseli"
                value={heroImage}
                onChange={setHeroImage}
                hint="Sayfa başlığının üstünde büyük banner olarak gösterilir"
              />

              <ImageGalleryField
                label="Galeri Görselleri"
                values={images}
                onChange={setImages}
              />

              <RichContentEditor
                label="Sayfa İçeriği"
                value={contentTr}
                onChange={setContentTr}
                rows={12}
              />

              {saved && (
                <p className="text-sm text-green-700">Kaydedildi.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kaydet
                </Button>
                <PreviewButton onClick={() => setPreviewOpen(true)} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-white p-12 text-muted">
            Düzenlemek için soldan bir sayfa seçin
          </div>
        )}
      </div>

      <AdminPreviewModal
        open={previewOpen && !!selected}
        onClose={() => setPreviewOpen(false)}
        title={selected ? `${selected.title.tr} — Önizleme` : "Önizleme"}
      >
        {selected && (
          <PagePreview
            title={selected.title.tr}
            content={contentTr}
            heroImage={heroImage}
            images={images}
          />
        )}
      </AdminPreviewModal>
    </div>
  );
}
