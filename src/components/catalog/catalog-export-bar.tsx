"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportFormat = "excel" | "pdf";

function buildExportQuery(searchParams: URLSearchParams, format: ExportFormat, includeImages: boolean) {
  const params = new URLSearchParams();
  for (const key of [
    "q",
    "sku",
    "make",
    "model",
    "engineInfo",
    "subModel",
    "vehicleId",
    "category",
    "catalog",
  ]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }
  params.set("format", format);
  params.set("includeImages", includeImages ? "1" : "0");
  return params.toString();
}

async function askIncludeImages(t: (key: string) => string): Promise<boolean | null> {
  const include = window.confirm(`${t("exportImageQuestion")}\n\n${t("exportImageYesNo")}`);
  if (!include) return false;

  const proceed = window.confirm(`${t("exportImageWarning")}\n\n${t("exportImageProceed")}`);
  return proceed ? true : null;
}

export function CatalogExportBar({ total }: { total: number }) {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    if (total === 0) return;

    const includeImages = await askIncludeImages(t);
    if (includeImages === null) return;

    setLoading(format);

    try {
      const query = buildExportQuery(searchParams, format, includeImages);
      const res = await fetch(`/api/catalog/export?${query}`);

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(data?.error || t("exportFailed"));
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename=\"?([^\";]+)\"?/);
      const filename =
        match?.[1] ||
        (format === "excel" ? "beseka-katalog.xlsx" : "beseka-katalog.pdf");

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t("exportFailed"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-muted">
        {t("exportHint", { total })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading !== null || total === 0}
          onClick={() => handleExport("excel")}
        >
          {loading === "excel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {t("exportExcel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading !== null || total === 0}
          onClick={() => handleExport("pdf")}
        >
          {loading === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {t("exportPdf")}
        </Button>
      </div>
    </div>
  );
}
