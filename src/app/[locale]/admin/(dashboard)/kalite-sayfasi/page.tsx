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
import { QualityDocumentsField } from "@/components/admin/quality-documents-field";
import { QualityVideosField } from "@/components/admin/quality-videos-field";
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
import {
  getQualityPageSortOrder,
  isLifeTestsPage,
  parseQualityMetadata,
  qualityPageConfigs,
  qualityPageSlugs,
  qualityRouteSlug,
  type QualityPageDocument,
  type QualityPageVideo,
} from "@/lib/quality/page-metadata";
import { getLocalizedText } from "@/lib/utils";

type Page = {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  metadata?: { documents?: QualityPageDocument[]; videos?: QualityPageVideo[] } | null;
  heroImage?: string | null;
  images: string[];
};

const pageLabels = Object.fromEntries(
  qualityPageConfigs.map((page) => [page.slug, page.label]),
) as Record<string, string>;

export default function AdminQualityPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selected, setSelected] = useState<Page | null>(null);
  const [title, setTitle] = useState(emptyLocalizedContent());
  const [content, setContent] = useState(emptyLocalizedContent());
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<QualityPageDocument[]>([]);
  const [videos, setVideos] = useState<QualityPageVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");

  function selectPage(page: Page) {
    const metadata = parseQualityMetadata(page.metadata);
    setSelected(page);
    setTitle(parseLocalizedContent(page.title));
    setContent(parseLocalizedContent(page.content));
    setHeroImage(page.heroImage || "");
    setImages(page.images || []);
    setDocuments(metadata.documents ?? []);
    setVideos(metadata.videos ?? []);
    setSaved(false);
  }

  async function load() {
    setLoading(true);
    setError("");

    try {
      let res = await fetch("/api/admin/pages?type=RD");
      let data: Page[] = await res.json();
      let qualityPages = data.filter((item) => qualityPageSlugs.includes(item.slug));

      if (qualityPages.length < qualityPageSlugs.length) {
        await fetch("/api/admin/pages/ensure-defaults", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "quality" }),
        });
        res = await fetch("/api/admin/pages?type=RD");
        data = await res.json();
        qualityPages = data.filter((item) => qualityPageSlugs.includes(item.slug));
      }

      if (qualityPages.length === 0) {
        setError("Kalite sayfaları oluşturulamadı. Lütfen sayfayı yenileyin.");
        setPages([]);
        setSelected(null);
        return;
      }

      qualityPages.sort(
        (a, b) => qualityPageSlugs.indexOf(a.slug) - qualityPageSlugs.indexOf(b.slug),
      );

      setPages(qualityPages);
      if (!selected || !qualityPages.find((p) => p.id === selected.id)) {
        selectPage(qualityPages[0]);
      } else {
        selectPage(qualityPages.find((p) => p.id === selected.id)!);
      }
    } catch {
      setError("Kalite sayfaları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        metadata: { documents, videos },
        isActive: true,
        sortOrder: getQualityPageSortOrder(selected.slug),
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
        Kalite sayfaları yükleniyor...
      </div>
    );
  }

  if (error || !selected) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p>{error || "Kalite sayfası bulunamadı."}</p>
        <Button type="button" className="mt-4" onClick={load}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const showVideos = isLifeTestsPage(selected.slug);
  const showDocuments = !showVideos;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Kalite Sayfaları</h1>
      <p className="mb-6 text-sm text-muted">
        <strong>Kalite Yönetimi</strong>, <strong>Belgelendirme</strong> ve{" "}
        <strong>Ömür Testleri</strong> sayfalarını buradan düzenleyin.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {pages.map((page) => (
          <Button
            key={page.id}
            type="button"
            variant={selected.id === page.id ? "default" : "outline"}
            onClick={() => selectPage(page)}
          >
            {pageLabels[page.slug] || getLocalizedText(page.title, "tr")}
          </Button>
        ))}
      </div>

      <p className="mb-4 text-xs text-muted">
        Site adresi:{" "}
        <code className="rounded bg-brand-cream-light px-1.5 py-0.5">
          /arge/{qualityRouteSlug(selected.slug)}
        </code>
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

          {showDocuments && (
            <QualityDocumentsField documents={documents} onChange={setDocuments} />
          )}

          {showVideos && <QualityVideosField videos={videos} onChange={setVideos} />}

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
          documents={documents}
          videos={videos}
        />
      </AdminPreviewModal>
    </div>
  );
}
