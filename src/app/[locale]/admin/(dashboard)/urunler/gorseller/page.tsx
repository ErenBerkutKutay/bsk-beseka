"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Label } from "@/components/ui/input";
import type { BulkImageImportRow, BulkImagePreviewRow } from "@/lib/products/bulk-image-match";

type PreviewData = {
  total: number;
  ready: number;
  skipped: number;
  notFound: number;
  invalid: number;
  rows: BulkImagePreviewRow[];
};

type ImportSummary = {
  updated: number;
  skipped: number;
  notFound: number;
  invalid: number;
  failed: number;
  rows: BulkImageImportRow[];
};

export default function BulkProductImagesPage() {
  const locale = useLocale();
  const [files, setFiles] = useState<File[]>([]);
  const [appendImages, setAppendImages] = useState(false);
  const [skipExisting, setSkipExisting] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const next = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    setFiles(next);
    setPreview(null);
    setResult(null);
  }, []);

  async function runPreview() {
    if (!files.length) return;
    setLoading("preview");
    setResult(null);

    const res = await fetch("/api/admin/products/bulk-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filenames: files.map((f) => f.name),
        skipExisting,
      }),
    });

    const data = await res.json();
    setPreview(data);
    setLoading(null);
  }

  async function runImport() {
    if (!files.length) return;
    if (!confirm(`${files.length} görsel ürünlere eklensin mi?`)) return;

    setLoading("import");
    setPreview(null);
    setImportProgress({ done: 0, total: files.length });

    const rows: BulkImageImportRow[] = [];
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let invalid = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("append", String(appendImages));
      formData.append("skipExisting", String(skipExisting));

      try {
        const res = await fetch("/api/admin/products/bulk-images", {
          method: "POST",
          body: formData,
        });
        const row = (await res.json()) as BulkImageImportRow;
        rows.push(row);

        switch (row.status) {
          case "updated":
            updated++;
            break;
          case "skipped":
            skipped++;
            break;
          case "not_found":
            notFound++;
            break;
          case "invalid_name":
            invalid++;
            break;
          case "failed":
            failed++;
            break;
        }
      } catch (err) {
        failed++;
        rows.push({
          filename: file.name,
          sku: "",
          status: "failed",
          message: err instanceof Error ? err.message : "Yükleme başarısız",
        });
      }

      setImportProgress({ done: i + 1, total: files.length });
    }

    setResult({ updated, skipped, notFound, invalid, failed, rows });
    setLoading(null);
  }

  return (
    <div>
      <Link
        href={`/${locale}/admin/urunler`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-brown"
      >
        <ArrowLeft className="h-4 w-4" />
        Ürünlere dön
      </Link>

      <h1 className="text-2xl font-bold text-brand-brown-dark">Toplu Görsel Yükleme</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Görselleri Beseka Ref kodu ile eşleştirerek yükleyin. Her dosya adı{" "}
        <span className="font-mono text-brand-brown">B8376.jpg</span> formatında olmalıdır.
      </p>

      <Card className="mt-6 border-brand-cream-dark/50 bg-brand-cream-light/30">
        <CardContent className="pt-6">
          <h2 className="flex items-center gap-2 font-semibold text-brand-brown-dark">
            <ImageIcon className="h-5 w-5" />
            Dosya adlandırma
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="font-mono text-brand-brown">B8376.jpg</span> → Ref:{" "}
              <strong className="text-brand-brown-dark">B8376</strong>
            </li>
            <li>
              <span className="font-mono text-brand-brown">B8306.T.jpg</span> → Ref:{" "}
              <strong className="text-brand-brown-dark">B8306.T</strong>
            </li>
            <li>Desteklenen uzantılar: .jpg, .jpeg, .png, .webp</li>
            <li>Büyük/küçük harf fark etmez</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="space-y-5 pt-6">
          <div>
            <Label>Görsel dosyaları</Label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-brand-cream-light/30 px-6 py-10 transition hover:border-brand-brown hover:bg-brand-cream-light/60">
              <Upload className="mb-3 h-10 w-10 text-brand-brown/60" />
              <span className="font-medium text-brand-brown-dark">
                {files.length
                  ? `${files.length} dosya seçildi`
                  : "Görselleri seçin veya sürükleyin"}
              </span>
              <span className="mt-1 text-xs text-muted">
                Birden fazla .jpg dosyası seçebilirsiniz
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) handleFiles(e.target.files);
                }}
              />
            </label>
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
              />
              Görseli olan ürünleri atla
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={appendImages}
                onChange={(e) => setAppendImages(e.target.checked)}
              />
              Mevcut görsellere ekle (işaretli değilse mevcut görselin yerine geçer)
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={runPreview}
              disabled={!files.length || loading !== null}
              className="gap-2"
            >
              {loading === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Önizle
            </Button>
            <Button
              type="button"
              onClick={runImport}
              disabled={!files.length || loading !== null}
              className="gap-2"
            >
              {loading === "import" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Yükle
            </Button>
          </div>

          {loading === "import" && importProgress.total > 0 && (
            <p className="text-sm text-muted">
              Yükleniyor: {importProgress.done} / {importProgress.total}
            </p>
          )}
        </CardContent>
      </Card>

      {preview && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-brand-brown-dark">Önizleme</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <div className="text-xl font-bold text-green-700">{preview.ready}</div>
                <div className="text-xs text-muted">Eşleşen</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <div className="text-xl font-bold text-amber-700">{preview.skipped}</div>
                <div className="text-xs text-muted">Atlanacak</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <div className="text-xl font-bold text-red-700">{preview.notFound}</div>
                <div className="text-xs text-muted">Ürün yok</div>
              </div>
              <div className="rounded-lg bg-zinc-100 p-3 text-center">
                <div className="text-xl font-bold text-zinc-700">{preview.invalid}</div>
                <div className="text-xs text-muted">Geçersiz ad</div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted">
                    <th className="py-2 pr-3">Dosya</th>
                    <th className="py-2 pr-3">Ref</th>
                    <th className="py-2 pr-3">Ürün</th>
                    <th className="py-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 50).map((row) => (
                    <tr key={row.filename} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono text-xs">{row.filename}</td>
                      <td className="py-2 pr-3 font-mono font-semibold">{row.sku || "—"}</td>
                      <td className="py-2 pr-3">{row.productName || "—"}</td>
                      <td className="py-2">
                        {row.status === "ready" && (
                          <span className="text-green-700">Hazır</span>
                        )}
                        {row.status === "skipped" && (
                          <span className="text-amber-700">{row.message}</span>
                        )}
                        {row.status === "not_found" && (
                          <span className="text-red-700">{row.message}</span>
                        )}
                        {row.status === "invalid_name" && (
                          <span className="text-zinc-600">{row.message}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 50 && (
                <p className="mt-2 text-xs text-muted">İlk 50 satır gösteriliyor</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-6 border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <h2 className="flex items-center gap-2 font-semibold text-brand-brown-dark">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Yükleme tamamlandı
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-700">{result.updated}</div>
                <div className="text-xs text-muted">Güncellendi</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-amber-700">{result.skipped}</div>
                <div className="text-xs text-muted">Atlandı</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-700">{result.notFound}</div>
                <div className="text-xs text-muted">Ürün yok</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-zinc-700">{result.invalid}</div>
                <div className="text-xs text-muted">Geçersiz ad</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                <div className="text-xs text-muted">Hata</div>
              </div>
            </div>

            {result.rows.some((r) => r.status !== "updated") && (
              <div className="mt-4 rounded-lg bg-white p-4 text-sm shadow-sm">
                <p className="flex items-center gap-1 font-semibold text-brand-brown-dark">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Detay
                </p>
                <ul className="mt-2 max-h-48 overflow-y-auto space-y-1 text-muted">
                  {result.rows
                    .filter((r) => r.status !== "updated")
                    .map((row) => (
                      <li key={`${row.filename}-${row.status}`}>
                        <span className="font-mono text-brand-brown">{row.filename}</span>
                        {row.message ? ` — ${row.message}` : ""}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <Link href={`/${locale}/admin/urunler`} className="mt-4 inline-block">
              <Button>Ürün Listesine Git</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
