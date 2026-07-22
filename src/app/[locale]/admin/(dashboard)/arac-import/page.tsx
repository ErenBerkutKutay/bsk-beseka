"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Label } from "@/components/ui/input";

type CatalogStats = {
  totalTypes: number;
  totalMakes: number;
  otomobilTypes: number;
};

type ImportResult = {
  total: number;
  imported: number;
  failed: number;
  purged?: number;
  errors: string[];
};

type ImportLog = {
  id: string;
  fileName: string;
  rowCount: number;
  successCount: number;
  errorCount: number;
  importedBy: string | null;
  createdAt: string;
};

export default function VehicleCatalogImportPage() {
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [purging, setPurging] = useState(false);

  async function loadMeta() {
    const [statsRes, logsRes] = await Promise.all([
      fetch("/api/admin/vehicles/import"),
      fetch("/api/admin/fitments/logs"),
    ]);
    setStats(await statsRes.json());
    setLogs(await logsRes.json());
  }

  useEffect(() => {
    loadMeta();
  }, []);

  async function handleImport(file: File) {
    if (!confirm(`${file.name} dosyası araç kataloğuna yüklensin mi?`)) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/vehicles/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
    loadMeta();
  }

  async function handleDeleteLog(id: string, fileName: string) {
    if (!confirm(`"${fileName}" import kaydı silinsin mi?`)) return;

    setDeletingId(id);
    try {
      await fetch(`/api/admin/fitments/logs/${id}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePurgeOldCatalog() {
    if (
      !confirm(
        "data/data.xlsx dışındaki tüm eski araç kayıtları silinecek. Ürün bağlantıları da kaldırılır. Devam edilsin mi?",
      )
    ) {
      return;
    }

    setPurging(true);
    setResult(null);

    const formData = new FormData();
    formData.append("syncBundled", "true");

    const res = await fetch("/api/admin/vehicles/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setPurging(false);
    loadMeta();
  }

  async function handleClearAllLogs() {
    if (!confirm("Tüm import geçmişi silinsin mi? Bu işlem geri alınamaz.")) return;

    setClearingAll(true);
    try {
      await fetch("/api/admin/fitments/logs?all=true", { method: "DELETE" });
      setLogs([]);
    } finally {
      setClearingAll(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Araç Kataloğu</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Repodaki <strong className="text-brand-brown-dark">data/data.xlsx</strong> dosyası deploy
        sırasında otomatik yüklenir. Her satırdaki benzersiz{" "}
        <strong className="text-brand-brown-dark">Id</strong> katalogda saklanır; ürün crosslama
        ve katalog filtreleri bu veriye göre çalışır.
      </p>

      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-brand-brown">{stats.totalTypes.toLocaleString("tr-TR")}</div>
              <div className="text-xs text-muted">Toplam tip kaydı</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-brand-brown">{stats.totalMakes.toLocaleString("tr-TR")}</div>
              <div className="text-xs text-muted">Üretici</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-brand-brown">{stats.otomobilTypes.toLocaleString("tr-TR")}</div>
              <div className="text-xs text-muted">Binek (Otomobil) tipi</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <Label>Excel Dosyası</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-brand-cream-light/30 px-6 py-10 transition hover:border-brand-brown">
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin text-brand-brown" />
            ) : (
              <FileSpreadsheet className="h-10 w-10 text-brand-brown/60" />
            )}
            <span className="mt-3 font-medium text-brand-brown-dark">data/data.xlsx</span>
            <span className="mt-1 text-xs text-muted">
              Id, Marka, Model, Motor Bilgisi, yıl, motor hacmi, yakıt, kW/HP, motor kodları
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
          </label>
          <p className="text-xs text-muted">
            Ürün düzenleme sayfasında Id ile crosslama yapabilirsiniz. Katalog aramasında marka /
            model / motor bilgisi filtreleri bu katalogdan gelir.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={purging || loading}
            onClick={handlePurgeOldCatalog}
            className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            {purging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Eski kayıtlar temizleniyor...
              </>
            ) : (
              "Eski Kataloğu Temizle (data.xlsx dışındakiler)"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="mb-8 border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-brand-brown-dark">Import tamamlandı</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold">{result.total.toLocaleString("tr-TR")}</div>
                <div className="text-xs text-muted">Toplam satır</div>
              </div>
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-700">{result.imported.toLocaleString("tr-TR")}</div>
                <div className="text-xs text-muted">Başarılı</div>
              </div>
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-700">{result.failed.toLocaleString("tr-TR")}</div>
                <div className="text-xs text-muted">Hata</div>
              </div>
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-amber-700">
                  {(result.purged ?? 0).toLocaleString("tr-TR")}
                </div>
                <div className="text-xs text-muted">Eski kayıt silindi</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <ul className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-brown-dark">Import Geçmişi</h2>
        {logs.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={clearingAll || !!deletingId}
            onClick={handleClearAllLogs}
            className="text-red-700 hover:text-red-800"
          >
            {clearingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tümünü Temizle"}
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {logs.length === 0 && <p className="text-sm text-muted">Henüz import kaydı yok.</p>}
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="font-medium">{log.fileName}</div>
                <div className="mt-1 text-sm text-muted">
                  {log.successCount.toLocaleString("tr-TR")}/{log.rowCount.toLocaleString("tr-TR")} başarılı ·{" "}
                  {log.errorCount} hata · {log.importedBy || "sistem"} ·{" "}
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletingId === log.id || clearingAll}
                onClick={() => handleDeleteLog(log.id, log.fileName)}
                aria-label="Import kaydını sil"
              >
                {deletingId === log.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-600" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
