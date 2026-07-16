"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImageIcon,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Label } from "@/components/ui/input";
import {
  BULK_PRODUCT_CSV_TEMPLATE,
  type BulkImportResult,
  type BulkProductRow,
} from "@/lib/products/bulk-import-parse";
import { createBulkProductExcelBuffer, excelBufferToCsv } from "@/lib/products/bulk-import-excel";

type PreviewData = {
  total: number;
  parseErrors: { line: number; message: string }[];
  preview: BulkProductRow[];
};

export default function BulkProductImportPage() {
  const locale = useLocale();
  const [fileName, setFileName] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);

  function downloadCsvTemplate() {
    const blob = new Blob([BULK_PRODUCT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beseka-urun-sablonu.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcelTemplate() {
    const buffer = createBulkProductExcelBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beseka-urun-sablonu.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);
    setPreview(null);

    const isExcel = /\.xlsx?$/i.test(file.name);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const csv = excelBufferToCsv(buffer);
          setCsvContent(csv);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Excel dosyası okunamadı");
          setCsvContent("");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  async function runPreview() {
    if (!csvContent.trim()) return;
    setLoading("preview");
    setResult(null);

    const res = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvContent, dryRun: true }),
    });

    const data = await res.json();
    setPreview(data);
    setLoading(null);
  }

  async function runImport() {
    if (!csvContent.trim()) return;
    if (!confirm("CSV dosyasındaki ürünler yüklensin mi?")) return;

    setLoading("import");

    const res = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvContent, updateExisting }),
    });

    const data = await res.json();
    setResult(data);
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

      <h1 className="text-2xl font-bold text-brand-brown-dark">Toplu Ürün Yükleme</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Excel veya CSV ile ürün bilgilerini toplu yükleyin. Görseller dosyaya eklenmez;
        yükleme sonrası her ürünü tek tek açıp manuel ekleyin.
      </p>

      <Card className="mt-6 border-brand-cream-dark/50 bg-brand-cream-light/30">
        <CardContent className="pt-6">
          <h2 className="flex items-center gap-2 font-semibold text-brand-brown-dark">
            <ImageIcon className="h-5 w-5" />
            Görseller nasıl eklenir?
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Excel/CSV ile ürünleri yükleyin (Ref, ad, açıklama, OEM vb.)</li>
            <li>
              <Link href={`/${locale}/admin/urunler`} className="font-medium text-brand-brown hover:underline">
                Ürünler
              </Link>{" "}
              listesinden görseli olmayan ürünü bulun
            </li>
            <li>
              <strong className="text-brand-brown-dark">Düzenle</strong> →{" "}
              <strong className="text-brand-brown-dark">Görseller</strong> bölümünden{" "}
              <strong className="text-brand-brown-dark">Görsel seç...</strong> ile dosya yükleyin
            </li>
            <li>Kaydedin — görsel sitede görünür</li>
          </ol>
          <p className="mt-3 text-xs text-muted">
            Her ürün için bir veya birden fazla görsel yükleyebilirsiniz. Toplu yükleme görselleri
            değiştirmez; mevcut görseller korunur.
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
              <span className="mt-1 text-xs text-muted">
                .xlsx veya .csv — Excel şablonunu doğrudan yükleyebilirsiniz
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
            />
            Mevcut Ref&apos;leri güncelle (işaretli değilse aynı kod tekrar yüklenemez)
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={runPreview}
              disabled={!csvContent || loading !== null}
              className="gap-2"
            >
              {loading === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Önizle
            </Button>
            <Button
              type="button"
              onClick={runImport}
              disabled={!csvContent || loading !== null}
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

      {/* Format yardımı */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold text-brand-brown-dark">CSV Sütunları</h2>
          <div className="mt-3 overflow-x-auto text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted">
                  <th className="py-2 pr-4">Sütun</th>
                  <th className="py-2 pr-4">Zorunlu</th>
                  <th className="py-2">Açıklama</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                {[
                  ["ref", "Evet", "Beseka referans kodu (B8376)"],
                  ["urun_adi", "Evet", "Ürün adı (Türkçe)"],
                  ["aciklama", "Hayır", "Ürün açıklaması"],
                  ["kategori", "Evet", "Kategori slug (motor-takozlari)"],
                  ["oem_kodlari", "Hayır", "12 34-56.78|77 888 (| ile ayırın)"],
                  ["cross_kodlari", "Hayır", "Cross kodları"],
                  ["yeni", "Hayır", "evet / hayır"],
                  ["aktif", "Hayır", "evet / hayır (varsayılan: evet)"],
                ].map(([col, req, desc]) => (
                  <tr key={col} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-mono text-brand-brown">{col}</td>
                    <td className="py-2 pr-4">{req}</td>
                    <td className="py-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Önizleme */}
      {preview && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-brand-brown-dark">
              Önizleme — {preview.total} satır
            </h2>
            {preview.parseErrors.length > 0 && (
              <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Parse hataları ({preview.parseErrors.length})</p>
                <ul className="mt-2 list-inside list-disc">
                  {preview.parseErrors.slice(0, 10).map((e) => (
                    <li key={`${e.line}-${e.message}`}>
                      Satır {e.line}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted">
                    <th className="py-2 pr-3">Ref</th>
                    <th className="py-2 pr-3">Ürün</th>
                    <th className="py-2 pr-3">Kategori</th>
                    <th className="py-2 pr-3">OEM</th>
                    <th className="py-2">Yeni</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row) => (
                    <tr key={row.sku} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono font-semibold">{row.sku}</td>
                      <td className="py-2 pr-3">{row.nameTr}</td>
                      <td className="py-2 pr-3 text-muted">{row.categorySlug}</td>
                      <td className="py-2 pr-3 font-mono text-xs">
                        {row.oemCodes.join(", ") || "—"}
                      </td>
                      <td className="py-2">{row.isNew ? "Evet" : "Hayır"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.total > 20 && (
                <p className="mt-2 text-xs text-muted">İlk 20 satır gösteriliyor</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sonuç */}
      {result && (
        <Card className="mt-6 border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <h2 className="flex items-center gap-2 font-semibold text-brand-brown-dark">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              İçe aktarma tamamlandı
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-700">{result.created}</div>
                <div className="text-xs text-muted">Yeni eklendi</div>
              </div>
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-700">{result.updated}</div>
                <div className="text-xs text-muted">Güncellendi</div>
              </div>
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                <div className="text-xs text-muted">Başarısız</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                <p className="flex items-center gap-1 font-semibold">
                  <XCircle className="h-4 w-4" />
                  Hatalar
                </p>
                <ul className="mt-2 max-h-40 overflow-y-auto list-inside list-disc">
                  {result.errors.map((e) => (
                    <li key={`${e.line}-${e.message}`}>
                      {e.line > 0 ? `Satır ${e.line}: ` : ""}
                      {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 rounded-lg border border-brand-cream-dark/40 bg-white px-4 py-3 text-sm text-muted">
              Görselleri şimdi eklemek için{" "}
              <Link href={`/${locale}/admin/urunler`} className="font-medium text-brand-brown hover:underline">
                ürün listesine
              </Link>{" "}
              gidin, her ürünü düzenleyip &quot;Görsel seç...&quot; ile yükleyin.
            </p>

            <Link href={`/${locale}/admin/urunler`} className="mt-4 inline-block">
              <Button>Ürün Listesine Git</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
