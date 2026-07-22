import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { importVehicleTypesFromBuffer } from "./import-vehicle-types";

export const VEHICLE_CATALOG_PATH = resolve(process.cwd(), "data/data.xlsx");

export async function syncVehicleCatalog(options?: {
  filePath?: string;
  importedBy?: string;
  purgeStale?: boolean;
  skipLog?: boolean;
}) {
  const filePath = options?.filePath || VEHICLE_CATALOG_PATH;

  if (!existsSync(filePath)) {
    console.warn(`Araç kataloğu bulunamadı: ${filePath}`);
    return { skipped: true as const, reason: "file-not-found" };
  }

  console.log(`Araç kataloğu yükleniyor: ${filePath}`);
  const buffer = readFileSync(filePath);
  const result = await importVehicleTypesFromBuffer(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    {
      fileName: filePath.split("/").pop(),
      importedBy: options?.importedBy || "sync-vehicle-catalog",
      purgeStale: options?.purgeStale !== false,
      skipLog: options?.skipLog ?? true,
    },
  );

  console.log(
    `Araç kataloğu: ${result.imported}/${result.total} kayıt (${result.failed} hata, ${result.purged} eski kayıt silindi)`,
  );

  return { skipped: false as const, ...result };
}
