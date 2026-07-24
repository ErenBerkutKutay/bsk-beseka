"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Input, Label } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";
import { getLocalizedText } from "@/lib/utils";

type DownloadAsset = {
  id: string;
  title: Record<string, string>;
  coverImage?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  title: emptyLocalizedContent(),
  coverImage: "",
  fileUrl: "",
  fileName: "",
  mimeType: "",
  fileSize: 0,
  sortOrder: 0,
  isActive: true,
};

async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", "document");
  formData.append("folder", "uploads/downloads");
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = (await res.json()) as {
    url?: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || "Dosya yüklenemedi.");
  return data;
}

export default function AdminDownloadsPage() {
  const [assets, setAssets] = useState<DownloadAsset[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/downloads");
    if (res.ok) setAssets(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(asset: DownloadAsset) {
    setEditingId(asset.id);
    setForm({
      title: parseLocalizedContent(asset.title),
      coverImage: asset.coverImage || "",
      fileUrl: asset.fileUrl,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      sortOrder: asset.sortOrder,
      isActive: asset.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const data = await uploadDocument(file);
      setForm((prev) => ({
        ...prev,
        fileUrl: data.url || "",
        fileName: data.fileName || file.name,
        mimeType: data.mimeType || file.type,
        fileSize: data.size || file.size,
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dosya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fileUrl) {
      alert("Lütfen indirilecek dosyayı yükleyin.");
      return;
    }

    setSaving(true);
    const url = editingId ? `/api/admin/downloads/${editingId}` : "/api/admin/downloads";
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/downloads/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">İndirme Merkezi</h1>
      <p className="mb-6 text-sm text-muted">
        Kurumsal kimlik PDF, logo PNG ve diğer dosyaları buradan yükleyin. Ziyaretçiler indirme merkezinden indirebilir.
      </p>

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-bold text-brand-brown-dark">
            {editingId ? "Dosyayı Düzenle" : "Yeni Dosya Ekle"}
          </h2>

          <LocalizedTextFields
            label="Başlık"
            values={form.title}
            onChange={(lang: AppLocale, value) => setForm((prev) => ({ ...prev, title: { ...prev.title, [lang]: value } }))}
            requiredLocale="tr"
          />

          <ImageUploadField
            label="Kapak Görseli"
            value={form.coverImage}
            onChange={(url) => setForm((prev) => ({ ...prev, coverImage: url }))}
            hint="Önerilen: 800 × 600 px. Logo veya PDF önizlemesi."
            uploadFolder="uploads"
          />

          <div>
            <Label>İndirilecek Dosya</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Dosya Yükle
              </Button>
              {form.fileName && <span className="text-sm text-muted">{form.fileName}</span>}
            </div>
            <p className="mt-1 text-xs text-muted">PDF, PNG, JPG, ZIP, SVG desteklenir.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.svg,.ai,.eps"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Sıra</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <label className="flex items-center gap-2 pt-8 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Yayında
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Güncelle" : "Kaydet"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="pt-4">
              {asset.coverImage && (
                <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <Image src={asset.coverImage} alt="" fill className="object-cover" sizes="300px" />
                </div>
              )}
              <h3 className="font-bold text-brand-brown-dark">{getLocalizedText(asset.title, "tr")}</h3>
              <p className="mt-1 text-xs text-muted">{asset.fileName}</p>
              <div className="mt-4 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => startEdit(asset)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(asset.id)} className="text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
