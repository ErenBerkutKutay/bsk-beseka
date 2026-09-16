"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Label } from "@/components/ui/input";
import {
  BULK_VEHICLE_CROSS_CSV_TEMPLATE,
  parseBulkVehicleCrossCsv,
  parseBulkVehicleCrossExcel,
  type BulkVehicleCrossRow,
} from "@/lib/products/bulk-vehicle-cross-parse";
import { createBulkVehicleCrossExcelBuffer } from "@/lib/products/bulk-vehicle-cross-excel";
import type { BulkVehicleCrossImportResult } from "@/lib/products/bulk-vehicle-cross-import";

const STATUS_LABELS: Record<string, string> = {
  ready: "Eklenecek",
  linked: "Eklendi",
  duplicate: "Zaten var / tekrar",
  product_not_found: "Ref bulunamadı",
  vehicle_not_found: "Araç Id yok",
};

export default function BulkVehicleCrossPage() {
  const locale = useLocale();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BulkVehicleCrossRow[]>([]);
  const [parseErrors, setParseErrors] = useState<{ line: number; message: string }[]>([]);
  const [preview, setPreview] = useState<BulkVehicleCrossImportResult | null>(null);
  const [result, setResult] = useState<BulkVehicleCrossImportResult | null>(null);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products/bulk-vehicle-cross");
      if (res.ok) {
        const data = await res.json();
        setTotalCount(data.count ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchCount();
  }, [fetchCount]);

  async function handleClearAll() {
    const formattedCount = totalCount !== null ? totalCount.toLocaleString("tr-TR") : "tüm";
    if (
      !confirm(
        `Sistemdeki TÜM araç cross bağlantıları (${formattedCount} kayıt) silinecek.\n\nBu işlem geri alınamaz! Devam etmek istediğinizden emin misiniz?`,
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch("/api/admin/products/bulk-vehicle-cross", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Temizleme işlemi başarısız oldu.");
      } else {
        alert(`${data.deleted?.toLocaleString("tr-TR") || 0} adet araç cross bağlantısı başarıyla temizlendi.`);
        void fetchCount();
        setPreview(null);
        setResult(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Temizleme sırasında hata oluştu.");
    } finally {
      setClearing(false);
    }
  }

  function downloadCsvTemplate() {
    const blob = new Blob([BULK_VEHICLE_CROSS_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "beseka-arac-cross-sablonu.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcelTemplate() {
    const buffer = createBulkVehicleCrossExcelBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "beseka-arac-cross-sablonu.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setPreview(null);
    setResult(null);

    const isExcel = /\.xlsx?$/i.test(file.name);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const parsed = parseBulkVehicleCrossExcel(buffer);
          setRows(parsed.rows);
          setParseErrors(parsed.errors);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Excel dosyası okunamadı");
          setRows([]);
          setParseErrors([]);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseBulkVehicleCrossCsv(text);
      setRows(parsed.rows);
      setParseErrors(parsed.errors);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  async function runPreview() {
    if (!rows.length && !parseErrors.length) return;
    setLoading("preview");
    setResult(null);

    const res = await fetch("/api/admin/products/bulk-vehicle-cross", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, parseErrors, dryRun: true }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Önizleme başarısız");
      setLoading(null);
      return;
    }

    setPreview(data);
    setLoading(null);
  }

  async function runImport() {
    if (!rows.length) return;
    const readyCount = preview?.rows.filter((row) => row.status === "ready").length ?? 0;
    if (!readyCount) {
      alert("Eklenecek geçerli eşleşme yok. Önce önizleme yapın.");
      return;
    }
    if (!confirm(`${readyCount} araç eşleşmesi ürünlere eklensin mi?`)) return;

    setLoading("import");
    setPreview(null);

    const res = await fetch("/api/admin/products/bulk-vehicle-cross", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, parseErrors, dryRun: false }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Yükleme başarısız");
      setLoading(null);
      return;
    }

    setResult(data);
    void fetchCount();
    setLoading(null);
  }

  const summary = result || preview;
  const problemRows =
    summary?.rows.filter((row) => row.status !== "ready" && row.status !== "linked") || [];

  return (
    <div>
      <Link
        href={`/${locale}/admin/urunler`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-brown"
      >
        <ArrowLeft className="h-4 w-4" />
        Ürünlere dön
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown-dark">Toplu Araç Crosslama</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Excel veya CSV ile ürün Ref kodlarını araç Id değerleriyle eşleştirin. A sütunu Beseka Ref,
            B sütunu araç Id olmalıdır.
          </p>
        </div>

        {totalCount !== null && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-cream-dark/60 bg-white p-3 shadow-sm">
            <div className="text-right">
              <span className="block text-xs font-medium text-muted">Mevcut Cross Bağlantısı</span>
              <span className="text-lg font-bold font-mono text-brand-brown-dark">
                {totalCount.toLocaleString("tr-TR")} kayıt
              </span>
            </div>
            {totalCount > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={clearing || loading !== null}
                onClick={handleClearAll}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Tümünü Temizle
              </Button>
            )}
          </div>
        )}
      </div>

      <Card className="mt-6 border-brand-cream-dark/50 bg-brand-cream-light/30">
        <CardContent className="pt-6 text-sm text-muted">
          <p>
            <strong className="text-brand-brown-dark">Ön koşul:</strong> Araç Id&apos;leri önce{" "}
            <Link href={`/${locale}/admin/arac-import`} className="font-medium text-brand-brown hover:underline">
              Araç Kataloğu
            </Link>{" "}
            sayfasından yüklenmiş olmalıdır.
          </p>
          <p className="mt-2 font-mono text-xs text-brand-brown-dark">
            B2510 → 12345
            <br />
            B2510 → 67890
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={downloadExcelTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Excel Şablonu (.xlsx)
        </Button>
        <Button variant="outline" onClick={downloadCsvTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          CSV Şablonu (.csv)
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-5 pt-6">
          <div>
            <Label>Excel / CSV Dosyası</Label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-brand-cream-light/30 px-6 py-10 transition hover:border-brand-brown hover:bg-brand-cream-light/60">
              <FileSpreadsheet className="mb-3 h-10 w-10 text-brand-brown/60" />
              <span className="font-medium text-brand-brown-dark">
                {fileName || "Dosya seçin veya sürükleyin"}
              </span>
              <span className="mt-1 text-xs text-muted">.xlsx veya .csv — A: Ref, B: Araç Id</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>

          {rows.length > 0 && (
            <p className="text-sm text-muted">
              {rows.length} geçerli satır okundu
              {parseErrors.length ? ` · ${parseErrors.length} satır hatalı` : ""}.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={loading !== null || !rows.length}
              onClick={runPreview}
              className="gap-2"
            >
              {loading === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Önizle
            </Button>
            <Button
              type="button"
              disabled={loading !== null || !rows.length}
              onClick={runImport}
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
        </CardContent>
      </Card>

      {parseErrors.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-amber-950">Dosya okuma uyarıları</h2>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900">
              {parseErrors.map((error) => (
                <li key={`parse-${error.line}-${error.message}`}>
                  Satır {error.line}: {error.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
              ) : (
                <FileSpreadsheet className="mt-0.5 h-6 w-6 shrink-0 text-brand-brown" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-brand-brown-dark">
                  {result ? "Yükleme tamamlandı" : "Önizleme"}
                </h2>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p>
                    Toplam satır: <strong>{summary.total}</strong>
                  </p>
                  <p>
                    {result ? "Eklenen" : "Eklenecek"}:{" "}
                    <strong className="text-green-700">
                      {result ? summary.linked : summary.rows.filter((r) => r.status === "ready").length}
                    </strong>
                  </p>
                  <p>
                    Ref bulunamadı: <strong>{summary.productNotFound}</strong>
                  </p>
                  <p>
                    Araç Id yok: <strong>{summary.vehicleNotFound}</strong>
                  </p>
                  <p>
                    Tekrar / zaten kayıtlı: <strong>{summary.duplicate}</strong>
                  </p>
                  <p>
                    Geçersiz satır: <strong>{summary.invalid}</strong>
                  </p>
                </div>
              </div>
            </div>

            {problemRows.length > 0 && (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-brown-dark">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Eklenemeyen satırlar ({problemRows.length})
                </h3>
                <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-brand-cream-light text-xs uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2">Satır</th>
                        <th className="px-3 py-2">Ref</th>
                        <th className="px-3 py-2">Araç Id</th>
                        <th className="px-3 py-2">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {problemRows.slice(0, 200).map((row) => (
                        <tr key={`${row.line}-${row.sku}-${row.tipNo}`}>
                          <td className="px-3 py-2">{row.line}</td>
                          <td className="px-3 py-2 font-mono">{row.sku}</td>
                          <td className="px-3 py-2 font-mono">{row.tipNo}</td>
                          <td className="px-3 py-2 text-muted">
                            {STATUS_LABELS[row.status] || row.status}
                            {row.message ? ` — ${row.message}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {problemRows.length > 200 && (
                  <p className="mt-2 text-xs text-muted">İlk 200 uyarı gösteriliyor.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
