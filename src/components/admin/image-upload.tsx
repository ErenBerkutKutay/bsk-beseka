"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export async function uploadAdminImage(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Görsel yüklenemedi.");
  }
  if (!data.url) {
    throw new Error("Sunucu geçerli bir görsel adresi döndürmedi.");
  }
  return data.url;
}

export function extractImageUrlsFromHtml(html: string): string[] {
  if (!html.trim()) return [];

  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;

  for (const match of html.matchAll(imgRegex)) {
    const src = match[1]?.trim();
    if (src) urls.push(src);
  }

  return [...new Set(urls)];
}

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  /** public/ altındaki hedef klasör, örn. "beseka/banners" */
  uploadFolder?: string;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  uploadFolder,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadAdminImage(file, uploadFolder);
      onChange(url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}

      {value ? (
        <div className="relative mt-2 overflow-hidden rounded-xl border border-border">
          <div className="relative aspect-[16/9] max-h-48 bg-brand-cream-light">
            <Image src={value} alt="" fill className="object-cover" sizes="400px" />
          </div>
          <div className="flex gap-2 border-t border-border bg-white p-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Değiştir
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange("")}>
              <Trash2 className="h-4 w-4" />
              Kaldır
            </Button>
          </div>
        </div>
      ) : (
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-brand-cream-light/40 px-4 py-8 transition hover:border-brand-brown hover:bg-brand-cream-light">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-brand-brown" />
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted" />
              <span className="text-sm font-medium text-brand-brown-dark">Görsel yükle</span>
              <span className="mt-1 text-xs text-muted">PNG, JPG, WEBP</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}

      {uploadError && (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="veya URL yapıştır: /beseka/..."
          className="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => {
            if (urlInput.trim()) {
              onChange(urlInput.trim());
              setUrlInput("");
              setUploadError(null);
            }
          }}
        >
          <Link2 className="h-4 w-4" />
          Ekle
        </Button>
      </div>
    </div>
  );
}

type ImageGalleryFieldProps = {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
};

export function ImageGalleryField({ label, values, onChange }: ImageGalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadAdminImage(file));
      }
      onChange([...values, ...urls]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <p className="mt-1 text-xs text-muted">Sayfa içinde galeri olarak gösterilir</p>

      <div className="mt-2 flex flex-wrap gap-3">
        {values.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border">
            <Image src={url} alt="" fill className="object-cover" sizes="96px" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted transition hover:border-brand-brown hover:text-brand-brown"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="mt-1 text-[10px]">Ekle</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
      </div>
    </div>
  );
}

type RichContentEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
};

export function RichContentEditor({
  label,
  value,
  onChange,
  rows = 10,
  required,
}: RichContentEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const contentImages = useMemo(() => extractImageUrlsFromHtml(value), [value]);
  const renderedHtml = useMemo(() => renderPageContent(value), [value]);

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      onChange(value ? `${value}\n${snippet}` : snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
  }

  async function insertUploadedImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadAdminImage(file);
      insertAtCursor(
        `\n<img src="${url}" alt="" class="content-image" />\n`,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            Görsel ekle
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertUploadedImage(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="mb-2 text-xs text-muted">
        Metin yazın veya araç çubuğundan görsel ekleyin. Görseller içeriğe otomatik yerleştirilir.
      </p>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        required={required}
        className="flex w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-brown"
      />

      {contentImages.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-brand-cream-light/30 p-3">
          <p className="text-xs font-medium text-brand-brown-dark">
            İçerikteki görseller ({contentImages.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {contentImages.map((url) => (
              <div
                key={url}
                className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-white"
              >
                <Image src={url} alt="" fill className="object-cover" sizes="96px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {value.trim() && (
        <div className="mt-3 rounded-xl border border-border bg-white p-4">
          <p className="mb-2 text-xs font-medium text-brand-brown-dark">İçerik önizlemesi</p>
          <div
            className="prose-content max-h-80 overflow-y-auto text-sm"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      )}
    </div>
  );
}

export function renderPageContent(content: string) {
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  return content.replace(/\n/g, "<br/>");
}
