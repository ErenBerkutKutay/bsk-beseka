"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/input";
import {
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
} from "@/lib/i18n/localized-content";

type Page = {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  heroImage?: string | null;
  images: string[];
};

export default function AdminQualityPage() {
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState(emptyLocalizedContent());
  const [content, setContent] = useState(emptyLocalizedContent());
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      let res = await fetch("/api/admin/pages?type=RD");
      let pages: Page[] = await res.json();
      let quality = pages.find((item) => item.slug === "arge-kalite-kontrol");

      if (!quality) {
        await fetch("/api/admin/pages/ensure-defaults", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "quality" }),
        });
        res = await fetch("/api/admin/pages?type=RD");
        pages = await res.json();
        quality = pages.find((item) => item.slug === "arge-kalite-kontrol");
      }

      if (!quality) {
        setError("Kalite sayfası oluşturulamadı. Lütfen sayfayı yenileyin.");
        setPage(null);
        return;
      }

      setPage(quality);
      setTitle(parseLocalizedContent(quality.title));
      setContent(parseLocalizedContent(quality.content));
      setHeroImage(quality.heroImage || "");
      setImages(quality.images || []);
    } catch {
      setError("Kalite sayfası yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!page) return;
    setSaving(true);
    setSaved(false);

    await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: page.id,
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Kalite sayfası yükleniyor...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p>{error || "Kalite sayfası bulunamadı."}</p>
        <Button type="button" className="mt-4" onClick={load}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Kalite Sayfası</h1>
      <p className="mb-6 text-sm text-muted">
        Menüdeki <strong>Kalite</strong> bağlantısının açtığı sayfayı buradan düzenleyin.
      </p>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <LocalizedTextFields
            label="Sayfa Başlığı"
            values={title}
            onChange={(lang: AppLocale, value) => setTitle((prev) => ({ ...prev, [lang]: value }))}
            requiredLocale="tr"
          />

          <ImageUploadField
            label="Kapak / Hero Görseli"
            value={heroImage}
            onChange={setHeroImage}
            hint="Sayfa başlığının üstünde büyük banner olarak gösterilir"
          />

          <ImageGalleryField label="Galeri Görselleri" values={images} onChange={setImages} />

          <LocalizedRichContentFields
            label="Sayfa İçeriği"
            values={content}
            onChange={(lang: AppLocale, value) => setContent((prev) => ({ ...prev, [lang]: value }))}
            rows={12}
            requiredLocale="tr"
          />

          {saved && <p className="text-sm text-green-700">Kaydedildi.</p>}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
            <PreviewButton onClick={() => setPreviewOpen(true)} />
          </div>
        </CardContent>
      </Card>

      <AdminPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`${title.tr} — Önizleme`}
      >
        <PagePreview
          title={title.tr}
          content={content.tr}
          heroImage={heroImage}
          images={images}
        />
      </AdminPreviewModal>
    </div>
  );
}
