import { db } from "@/lib/db";
import {
  findDuplicateIdsInExcelBuffer,
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
  purged: number;
  duplicateIds: number[];
  errors: string[];
};

function formatDuplicateIdsMessage(ids: number[]): string {
  const preview = ids.slice(0, 25).join(", ");
  const suffix = ids.length > 25 ? ` ve ${ids.length - 25} Id daha` : "";
  return `Bu Id'ler mükerrer: ${preview}${suffix}`;
}

async function findExistingTipNos(tipNos: number[]): Promise<number[]> {
  const existing = new Set<number>();

  for (let i = 0; i < tipNos.length; i += 500) {
    const chunk = tipNos.slice(i, i + 500);
    const rows = await db.vehicleType.findMany({
      where: { tipNo: { in: chunk } },
      select: { tipNo: true },
    });

    for (const row of rows) {
      existing.add(row.tipNo);
    }
  }

  return tipNos.filter((tipNo) => existing.has(tipNo));
}

export async function purgeStaleVehicleTypes(validTipNos: number[]) {
  if (!validTipNos.length) {
    return { deleted: 0 };
  }

  const validSet = new Set(validTipNos);
  let deleted = 0;
  let cursor: number | undefined;

  while (true) {
    const rows = await db.vehicleType.findMany({
      select: { tipNo: true },
      orderBy: { tipNo: "asc" },
      take: 1000,
      ...(cursor !== undefined ? { where: { tipNo: { gt: cursor } } } : {}),
    });

    if (!rows.length) break;

    const staleTipNos = rows
      .map((row) => row.tipNo)
      .filter((tipNo) => !validSet.has(tipNo));

    for (let i = 0; i < staleTipNos.length; i += 500) {
      const chunk = staleTipNos.slice(i, i + 500);
      const result = await db.vehicleType.deleteMany({
        where: { tipNo: { in: chunk } },
      });
      deleted += result.count;
    }

    cursor = rows[rows.length - 1]?.tipNo;
  }

  return { deleted };
}

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
      engineVolumeCcm: data.engineVolumeCcm,
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
  options?: {
    importedBy?: string;
    fileName?: string;
    purgeStale?: boolean;
    skipLog?: boolean;
    rejectExistingIds?: boolean;
  },
): Promise<VehicleTypeImportResult> {
  const duplicateIdsInFile = findDuplicateIdsInExcelBuffer(buffer);
  if (duplicateIdsInFile.length) {
    const result: VehicleTypeImportResult = {
      total: 0,
      imported: 0,
      failed: 0,
      purged: 0,
      duplicateIds: duplicateIdsInFile,
      errors: [formatDuplicateIdsMessage(duplicateIdsInFile)],
    };

    if (!options?.skipLog) {
      await db.fitmentImportLog.create({
        data: {
          fileName: options?.fileName || "vehicle-types-import",
          rowCount: 0,
          successCount: 0,
          errorCount: duplicateIdsInFile.length,
          errors: result.errors,
          importedBy: options?.importedBy || null,
        },
      });
    }

    return result;
  }

  const rows = parseVehicleTypesFromExcelBuffer(buffer);
  const result: VehicleTypeImportResult = {
    total: rows.length,
    imported: 0,
    failed: 0,
    purged: 0,
    duplicateIds: [],
    errors: [],
  };

  if (options?.rejectExistingIds) {
    const duplicateIdsInDb = await findExistingTipNos(rows.map((row) => row.tipNo));
    if (duplicateIdsInDb.length) {
      result.failed = rows.length;
      result.duplicateIds = duplicateIdsInDb;
      result.errors = [formatDuplicateIdsMessage(duplicateIdsInDb)];

      if (!options?.skipLog) {
        await db.fitmentImportLog.create({
          data: {
            fileName: options?.fileName || "vehicle-types-import",
            rowCount: result.total,
            successCount: 0,
            errorCount: duplicateIdsInDb.length,
            errors: result.errors,
            importedBy: options?.importedBy || null,
          },
        });
      }

      return result;
    }
  }

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

  if (options?.purgeStale !== false) {
    const { deleted } = await purgeStaleVehicleTypes(rows.map((row) => row.tipNo));
    result.purged = deleted;
    if (deleted > 0) {
      console.log(`Eski katalog kayıtları temizlendi: ${deleted}`);
    }
  }

  if (!options?.skipLog) {
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
  }

  return result;
}

export type ManualVehicleCreateResult =
  | { ok: true; tipNo: number }
  | { ok: false; error: string; duplicateIds: number[] };

export async function createVehicleTypeManual(
  item: ParsedVehicleType,
  options?: { importedBy?: string },
): Promise<ManualVehicleCreateResult> {
  const existing = await db.vehicleType.findUnique({
    where: { tipNo: item.tipNo },
    select: { tipNo: true },
  });

  if (existing) {
    return {
      ok: false,
      error: formatDuplicateIdsMessage([item.tipNo]),
      duplicateIds: [item.tipNo],
    };
  }

  await db.vehicleType.create({
    data: toVehicleTypeCreateInput(item),
  });

  await db.fitmentImportLog.create({
    data: {
      fileName: `manual-${item.tipNo}`,
      rowCount: 1,
      successCount: 1,
      errorCount: 0,
      importedBy: options?.importedBy || null,
    },
  });

  return { ok: true, tipNo: item.tipNo };
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
