"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import type { AppLocale } from "@/i18n/routing";
import { emptyLocalizedContent } from "@/lib/i18n/localized-content";
import type { QualityPageDocument } from "@/lib/quality/page-metadata";
import { getLocalizedText } from "@/lib/utils";

async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", "document");
  formData.append("folder", "uploads/quality");
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

type QualityDocumentsFieldProps = {
  documents: QualityPageDocument[];
  onChange: (documents: QualityPageDocument[]) => void;
};

export function QualityDocumentsField({ documents, onChange }: QualityDocumentsFieldProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editing = documents.find((doc) => doc.id === editingId);
  const draft = editing ?? {
    id: "",
    title: emptyLocalizedContent(),
    coverImage: "",
    fileUrl: "",
    fileName: "",
    mimeType: "",
    fileSize: 0,
    sortOrder: documents.length,
  };

  function updateDraft(partial: Partial<QualityPageDocument>) {
    if (!editingId) return;
    onChange(documents.map((doc) => (doc.id === editingId ? { ...doc, ...partial } : doc)));
  }

  function startNew() {
    const id = crypto.randomUUID();
    const next: QualityPageDocument = {
      id,
      title: emptyLocalizedContent(),
      coverImage: "",
      fileUrl: "",
      fileName: "",
      mimeType: "",
      fileSize: 0,
      sortOrder: documents.length,
    };
    onChange([...documents, next]);
    setEditingId(id);
  }

  function removeDocument(id: string) {
    onChange(documents.filter((doc) => doc.id !== id));
    if (editingId === id) setEditingId(null);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const data = await uploadDocument(file);
      const patch = {
        fileUrl: data.url || "",
        fileName: data.fileName || file.name,
        mimeType: data.mimeType || file.type,
        fileSize: data.size || file.size,
      };

      if (editingId) {
        updateDraft(patch);
      } else {
        const id = crypto.randomUUID();
        onChange([
          ...documents,
          {
            id,
            title: emptyLocalizedContent(),
            coverImage: "",
            ...patch,
            sortOrder: documents.length,
          },
        ]);
        setEditingId(id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dosya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>PDF ve Görseller</Label>
          <p className="mt-1 text-xs text-muted">
            Sertifikalar, belgeler ve görselleri buradan ekleyin. PDF için kapak görseli önerilir.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={startNew} className="gap-1">
          <Plus className="h-4 w-4" />
          Dosya Ekle
        </Button>
      </div>

      {(editingId || documents.length === 0) && (
        <div className="rounded-xl border border-border bg-brand-cream-light/40 p-4 space-y-4">
          <LocalizedTextFields
            label="Dosya Başlığı"
            values={draft.title}
            onChange={(lang: AppLocale, value) => {
              if (editingId) {
                updateDraft({ title: { ...draft.title, [lang]: value } });
              }
            }}
            requiredLocale="tr"
          />

          <ImageUploadField
            label="Kapak Görseli (PDF için)"
            value={draft.coverImage || ""}
            onChange={(url) => editingId && updateDraft({ coverImage: url })}
            hint="PDF belgeleri için önizleme görseli. Doğrudan görsel yüklüyorsanız opsiyonel."
            uploadFolder="uploads/quality"
          />

          <div>
            <Label>Dosya</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Dosya Yükle
              </Button>
              {draft.fileName && <span className="text-sm text-muted">{draft.fileName}</span>}
            </div>
            <p className="mt-1 text-xs text-muted">PDF, PNG, JPG, WEBP desteklenir.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
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
                value={draft.sortOrder}
                onChange={(e) =>
                  editingId && updateDraft({ sortOrder: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
              Düzenlemeyi Kapat
            </Button>
          )}
        </div>
      )}

      {documents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex gap-3 rounded-xl border border-border bg-white p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-cream-light">
                {doc.coverImage || doc.mimeType.startsWith("image/") ? (
                  <Image
                    src={doc.coverImage || doc.fileUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">PDF</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-brown-dark">
                  {getLocalizedText(doc.title, "tr") || doc.fileName || "Başlıksız"}
                </p>
                <p className="truncate text-xs text-muted">{doc.fileName}</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(doc.id)}>
                    Düzenle
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeDocument(doc.id)}
                    className="text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
