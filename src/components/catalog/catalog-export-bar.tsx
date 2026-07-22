"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportFormat = "excel" | "pdf";
type DialogStep = "choose" | "warn";

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

export function CatalogExportBar({ total }: { total: number }) {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);
  const [dialogStep, setDialogStep] = useState<DialogStep | null>(null);

  function closeDialog() {
    setPendingFormat(null);
    setDialogStep(null);
  }

  function openExportDialog(format: ExportFormat) {
    if (total === 0) return;
    setPendingFormat(format);
    setDialogStep("choose");
  }

  async function runExport(format: ExportFormat, includeImages: boolean) {
    closeDialog();
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

  const formatLabel =
    pendingFormat === "excel" ? t("exportExcel") : pendingFormat === "pdf" ? t("exportPdf") : "";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-muted">{t("exportHint", { total })}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={loading !== null || total === 0}
            onClick={() => openExportDialog("excel")}
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
            onClick={() => openExportDialog("pdf")}
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

      {dialogStep && pendingFormat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-brown-dark/60 backdrop-blur-sm" onClick={closeDialog} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-export-dialog-title"
            className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={closeDialog}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted transition hover:bg-brand-cream-light hover:text-brand-brown-dark"
              aria-label={t("exportCancel")}
            >
              <X className="h-5 w-5" />
            </button>

            {dialogStep === "choose" ? (
              <>
                <h2 id="catalog-export-dialog-title" className="pr-8 text-lg font-bold text-brand-brown-dark">
                  {formatLabel}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t("exportImageQuestion")}</p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    className="sm:flex-1"
                    onClick={() => runExport(pendingFormat, false)}
                  >
                    {t("exportWithoutImages")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:flex-1"
                    onClick={() => setDialogStep("warn")}
                  >
                    {t("exportWithImages")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    {t("exportCancel")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 id="catalog-export-dialog-title" className="pr-8 text-lg font-bold text-brand-brown-dark">
                  {t("exportWithImages")}
                </h2>
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                  {t("exportImageWarning")}
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" className="sm:flex-1" onClick={() => runExport(pendingFormat, true)}>
                    {t("exportContinue")}
                  </Button>
                  <Button type="button" variant="outline" className="sm:flex-1" onClick={closeDialog}>
                    {t("exportCancel")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
