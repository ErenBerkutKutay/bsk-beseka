"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Input, Label } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import { besekaAssets } from "@/lib/beseka/assets";
import { defaultCatalogPdfSettings } from "@/lib/catalog/pdf-settings-defaults";

type PdfSettingsForm = {
  logoUrl: string;
  headerBackgroundUrl: string;
  headerBackgroundColor: string;
  headerHeightMm: number;
  documentTitle: string;
  tableHeaderColor: string;
  isActive: boolean;
};

export default function AdminPdfTemplatePage() {
  const [form, setForm] = useState<PdfSettingsForm>({
    logoUrl: defaultCatalogPdfSettings.logoUrl,
    headerBackgroundUrl: "",
    headerBackgroundColor: defaultCatalogPdfSettings.headerBackgroundColor,
    headerHeightMm: defaultCatalogPdfSettings.headerHeightMm,
    documentTitle: defaultCatalogPdfSettings.documentTitle,
    tableHeaderColor: defaultCatalogPdfSettings.tableHeaderColor,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const previewHeaderStyle = useMemo(
    () => ({
      backgroundColor: form.headerBackgroundColor,
      minHeight: `${Math.round(form.headerHeightMm * 2.4)}px`,
    }),
    [form.headerBackgroundColor, form.headerHeightMm],
  );

  async function load() {
    setLoading(true);
    setLoadError(null);

    const res = await fetch("/api/admin/catalog-pdf");
    if (!res.ok) {
      setLoadError("PDF şablonu yüklenemedi.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setForm({
      logoUrl: data.logoUrl || besekaAssets.logo,
      headerBackgroundUrl: data.headerBackgroundUrl || "",
      headerBackgroundColor: data.headerBackgroundColor || defaultCatalogPdfSettings.headerBackgroundColor,
      headerHeightMm: data.headerHeightMm || defaultCatalogPdfSettings.headerHeightMm,
      documentTitle: data.documentTitle || defaultCatalogPdfSettings.documentTitle,
      tableHeaderColor: data.tableHeaderColor || defaultCatalogPdfSettings.tableHeaderColor,
      isActive: data.isActive ?? true,
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/admin/catalog-pdf", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        headerBackgroundUrl: form.headerBackgroundUrl || null,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      setLoadError("Kaydedilemedi. Lütfen alanları kontrol edin.");
      return;
    }

    setLoadError(null);
    setSaved(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-brown" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-brown-dark">PDF Şablonu</h1>
        <p className="mt-1 text-sm text-muted">
          Arama sonuçlarından indirilen katalog PDF&apos;inin üst başlığı ve tablo görünümünü özelleştirin.
        </p>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      )}

      <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-6 p-6">
            <ImageUploadField
              label="Logo"
              value={form.logoUrl}
              onChange={(logoUrl) => setForm((prev) => ({ ...prev, logoUrl: logoUrl || besekaAssets.logo }))}
              hint="Varsayılan: Beseka logosu. PDF üst bandında sol tarafta görünür."
              uploadFolder="beseka/pdf"
            />

            <ImageUploadField
              label="Üst band arka plan görseli"
              value={form.headerBackgroundUrl}
              onChange={(headerBackgroundUrl) => setForm((prev) => ({ ...prev, headerBackgroundUrl }))}
              hint="İsteğe bağlı. Yüklenmezse yalnızca arka plan rengi kullanılır."
              uploadFolder="beseka/pdf"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="headerBackgroundColor">Üst band rengi</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="headerBackgroundColor"
                    type="color"
                    value={form.headerBackgroundColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, headerBackgroundColor: e.target.value }))}
                    className="h-11 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.headerBackgroundColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, headerBackgroundColor: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tableHeaderColor">Tablo başlık rengi</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="tableHeaderColor"
                    type="color"
                    value={form.tableHeaderColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, tableHeaderColor: e.target.value }))}
                    className="h-11 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.tableHeaderColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, tableHeaderColor: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="documentTitle">PDF başlığı</Label>
                <Input
                  id="documentTitle"
                  value={form.documentTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, documentTitle: e.target.value }))}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="headerHeightMm">Üst band yüksekliği (mm)</Label>
                <Input
                  id="headerHeightMm"
                  type="number"
                  min={20}
                  max={60}
                  value={form.headerHeightMm}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, headerHeightMm: Number(e.target.value) || 32 }))
                  }
                  className="mt-2"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-brand-brown-dark">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              PDF şablonu aktif
            </label>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
              </Button>
              {saved && <span className="text-sm text-green-700">Kaydedildi.</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold text-brand-brown-dark">Önizleme</p>
              <p className="mt-1 text-xs text-muted">PDF üst bandı ve tablo kolonları</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <div className="relative flex items-center px-4 py-3" style={previewHeaderStyle}>
                {form.headerBackgroundUrl && (
                  <Image
                    src={form.headerBackgroundUrl}
                    alt=""
                    fill
                    className="object-cover opacity-80"
                    sizes="400px"
                  />
                )}
                {form.logoUrl && (
                  <div className="relative z-10 h-10 w-28">
                    <Image src={form.logoUrl} alt="Logo" fill className="object-contain object-left" sizes="112px" />
                  </div>
                )}
              </div>

              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-brand-brown-dark">{form.documentTitle}</p>
                <p className="text-xs text-muted">Oluşturulma: örnek tarih · 2 ürün</p>
              </div>

              <div
                className="grid grid-cols-7 gap-px bg-border text-[10px] font-semibold text-white"
                style={{ backgroundColor: form.tableHeaderColor }}
              >
                {["Görsel", "Beseka Kodu", "OEM", "Marka", "Model", "Başlangıç", "Bitiş"].map((label) => (
                  <div key={label} className="px-2 py-2 text-center">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-border text-[10px]">
                <div className="flex items-center justify-center bg-white p-2 text-muted">IMG</div>
                <div className="bg-white p-2 font-semibold">B6016</div>
                <div className="bg-zinc-50 p-2 leading-tight">46767476{"\n"}46759539</div>
                <div className="bg-white p-2">FORD</div>
                <div className="bg-zinc-50 p-2">TRANSIT</div>
                <div className="bg-white p-2 text-center">2002</div>
                <div className="bg-zinc-50 p-2 text-center">2013</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
