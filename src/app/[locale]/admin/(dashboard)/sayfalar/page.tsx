"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";
import {
  extractImageUrlsFromHtml,
  ImageGalleryField,
  ImageUploadField,
} from "@/components/admin/image-upload";
import {
  LocalizedRichContentFields,
  LocalizedTextFields,
} from "@/components/admin/localized-text-fields";
import {
  AdminPreviewModal,
  PagePreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
  contentLocales,
} from "@/lib/i18n/localized-content";

type Page = {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  heroImage?: string | null;
  images: string[];
};

function pageHasVisuals(page: Page): boolean {
  if (page.heroImage || (page.images?.length ?? 0) > 0) return true;
  return contentLocales.some((locale) => {
    const text = page.content?.[locale];
    return typeof text === "string" && extractImageUrlsFromHtml(text).length > 0;
  });
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selected, setSelected] = useState<Page | null>(null);
  const [title, setTitle] = useState(emptyLocalizedContent());
  const [content, setContent] = useState(emptyLocalizedContent());
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/pages");
    const data: (Page & { type?: string })[] = await res.json();
    setPages(data.filter((page) => page.type !== "CONTACT"));
  }

  useEffect(() => {
    load();
  }, []);

  function selectPage(page: Page) {
    setSelected(page);
    setTitle(parseLocalizedContent(page.title));
    setContent(parseLocalizedContent(page.content));
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
        title,
        content,
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
                {(pageHasVisuals(page)) && (
                  <span className="mt-1 block text-xs text-muted">📷 Görsel var</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <Card>
            <CardContent className="space-y-5 pt-6">
              <h2 className="text-lg font-bold text-brand-brown-dark">{selected.slug}</h2>

              <LocalizedTextFields
                label="Sayfa Başlığı"
                values={title}
                onChange={(lang: AppLocale, value) =>
                  setTitle((prev) => ({ ...prev, [lang]: value }))
                }
                requiredLocale="tr"
              />

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

              <LocalizedRichContentFields
                label="Sayfa İçeriği"
                values={content}
                onChange={(lang: AppLocale, value) =>
                  setContent((prev) => ({ ...prev, [lang]: value }))
                }
                rows={12}
                requiredLocale="tr"
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
        title={selected ? `${title.tr} — Önizleme` : "Önizleme"}
      >
        {selected && (
          <PagePreview
            title={title.tr}
            content={content.tr}
            heroImage={heroImage}
            images={images}
          />
        )}
      </AdminPreviewModal>
    </div>
  );
}
