import { db } from "@/lib/db";
import {
  parseVehicleTypesFromExcelBuffer,
  toVehicleTypeCreateInput,
  type ParsedVehicleType,
} from "./parse-vehicle-types";

const BATCH_SIZE = 250;

export type VehicleTypeImportResult = {
  total: number;
  imported: number;
  failed: number;
  errors: string[];
};

async function upsertBatch(batch: ParsedVehicleType[]) {
  await db.$transaction(
    batch.map((item) => {
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
    }),
  );
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
      result.failed += batch.length;
      result.errors.push(
        err instanceof Error
          ? `Satır ${i + 1}-${i + batch.length}: ${err.message}`
          : `Satır ${i + 1}-${i + batch.length}: Bilinmeyen hata`,
      );
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
