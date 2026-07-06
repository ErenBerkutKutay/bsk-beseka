"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/input";

type ImportLog = {
  id: string;
  fileName: string;
  rowCount: number;
  successCount: number;
  errorCount: number;
  importedBy: string | null;
  createdAt: string;
};

export default function FitmentImportLogsPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);

  useEffect(() => {
    fetch("/api/admin/fitments/logs")
      .then((res) => res.json())
      .then(setLogs)
      .catch(() => setLogs([]));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Araç Uyumluluk Import Logları</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Toplu CSV import işlemlerinin geçmişi. Ürün düzenleme sayfasından
        marka;model;altModel;yilBas;yilBit;motor formatında yükleyebilirsiniz.
      </p>
      <div className="space-y-3">
        {logs.length === 0 && (
          <p className="text-zinc-500">Henüz import kaydı yok.</p>
        )}
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="py-4">
              <div className="font-medium">{log.fileName}</div>
              <div className="mt-1 text-sm text-zinc-500">
                {log.successCount}/{log.rowCount} başarılı · {log.errorCount} hata ·{" "}
                {log.importedBy || "sistem"} ·{" "}
                {new Date(log.createdAt).toLocaleString("tr-TR")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
