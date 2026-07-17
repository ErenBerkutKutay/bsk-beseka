import { db } from "@/lib/db";
import {
  parseVehicleTypesFromExcelBuffer,
  toVehicleTypeCreateInput,
  type ParsedVehicleType,
} from "./parse-vehicle-types";

const BATCH_SIZE = 100;
const UPSERT_CONCURRENCY = 15;

export type VehicleTypeImportResult = {
  total: number;
  imported: number;
  failed: number;
  errors: string[];
};

function upsertVehicleType(item: ParsedVehicleType) {
  const data = toVehicleTypeCreateInput(item);
  return db.vehicleType.upsert({
    where: { tipNo: item.tipNo },
    create: data,
    update: {
      vehicleClass: data.vehicleClass,
      linkTargetType: data.linkTargetType,
      make: data.make,
      modelSeries: data.modelSeries,
      typeName: data.typeName,
      modelSeriesNo: data.modelSeriesNo,
      yearFrom: data.yearFrom,
      yearTo: data.yearTo,
      bodyType: data.bodyType,
      driveType: data.driveType,
      engineVolumeL: data.engineVolumeL,
      fuelType: data.fuelType,
      kw: data.kw,
      hp: data.hp,
      engineCodes: data.engineCodes,
      motorNumbers: data.motorNumbers,
      manufacturerNo: data.manufacturerNo,
      dateGeneral: data.dateGeneral,
    },
  });
}

async function upsertBatch(batch: ParsedVehicleType[]) {
  for (let i = 0; i < batch.length; i += UPSERT_CONCURRENCY) {
    const chunk = batch.slice(i, i + UPSERT_CONCURRENCY);
    await Promise.all(chunk.map((item) => upsertVehicleType(item)));
  }
}

export async function importVehicleTypesFromBuffer(
  buffer: ArrayBuffer,
  options?: { importedBy?: string; fileName?: string },
): Promise<VehicleTypeImportResult> {
  const rows = parseVehicleTypesFromExcelBuffer(buffer);
  const result: VehicleTypeImportResult = {
    total: rows.length,
    imported: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    try {
      await upsertBatch(batch);
      result.imported += batch.length;
    } catch (err) {
      for (const item of batch) {
        try {
          await upsertVehicleType(item);
          result.imported += 1;
        } catch (itemErr) {
          result.failed += 1;
          if (result.errors.length < 50) {
            result.errors.push(
              itemErr instanceof Error
                ? `${item.tipNo}: ${itemErr.message}`
                : `${item.tipNo}: Bilinmeyen hata`,
            );
          }
        }
      }
      if (err instanceof Error && result.errors.length < 50) {
        result.errors.push(`Satır ${i + 1}-${i + batch.length}: ${err.message}`);
      }
    }

    if ((i / BATCH_SIZE) % 20 === 0) {
      console.log(`İlerleme: ${Math.min(i + batch.length, rows.length)} / ${rows.length}`);
    }
  }

  await db.fitmentImportLog.create({
    data: {
      fileName: options?.fileName || "vehicle-types-import",
      rowCount: result.total,
      successCount: result.imported,
      errorCount: result.failed,
      errors: result.errors.length ? result.errors.slice(0, 50) : undefined,
      importedBy: options?.importedBy || null,
    },
  });

  return result;
}

export async function getVehicleCatalogStats() {
  const [total, makes, otomobil] = await Promise.all([
    db.vehicleType.count(),
    db.vehicleType.groupBy({ by: ["make"], _count: true }),
    db.vehicleType.count({
      where: { linkTargetType: { in: ["Otomobil", "E-Otomobil"] } },
    }),
  ]);

  return {
    totalTypes: total,
    totalMakes: makes.length,
    otomobilTypes: otomobil,
  };
}
