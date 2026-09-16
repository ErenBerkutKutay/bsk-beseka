import { db } from "@/lib/db";
import type {
  BulkVehicleCrossParseError,
  BulkVehicleCrossRow,
} from "./bulk-vehicle-cross-parse";

export type BulkVehicleCrossRowStatus =
  | "ready"
  | "linked"
  | "duplicate"
  | "product_not_found"
  | "vehicle_not_found";

export type BulkVehicleCrossPreviewRow = {
  line: number;
  sku: string;
  tipNo: number;
  status: BulkVehicleCrossRowStatus;
  message?: string;
};

export type BulkVehicleCrossImportResult = {
  linked: number;
  duplicate: number;
  productNotFound: number;
  vehicleNotFound: number;
  invalid: number;
  total: number;
  rows: BulkVehicleCrossPreviewRow[];
  parseErrors: BulkVehicleCrossParseError[];
};

function linkKey(productId: string, tipNo: number) {
  return `${productId}:${tipNo}`;
}

async function buildPreviewRows(
  rows: BulkVehicleCrossRow[],
  existingLinkKeys: Set<string>,
): Promise<BulkVehicleCrossPreviewRow[]> {
  const uniqueSkus = [...new Set(rows.map((row) => row.sku))];
  const uniqueTipNos = [...new Set(rows.map((row) => row.tipNo))];

  const products = uniqueSkus.length
    ? await db.product.findMany({
        where: {
          OR: uniqueSkus.map((sku) => ({ sku: { equals: sku, mode: "insensitive" as const } })),
        },
        select: { id: true, sku: true },
      })
    : [];

  const productIdBySku = new Map(
    products.map((product) => [product.sku.toUpperCase(), product.id]),
  );

  const vehicleTypes = uniqueTipNos.length
    ? await db.vehicleType.findMany({
        where: { tipNo: { in: uniqueTipNos } },
        select: { tipNo: true },
      })
    : [];
  const validTipNos = new Set(vehicleTypes.map((item) => item.tipNo));

  const previewRows: BulkVehicleCrossPreviewRow[] = [];
  const seenInFile = new Set<string>();

  for (const row of rows) {
    const fileKey = `${row.sku}:${row.tipNo}`;

    if (seenInFile.has(fileKey)) {
      previewRows.push({
        ...row,
        status: "duplicate",
        message: "Bu satır dosyada tekrar ediyor",
      });
      continue;
    }
    seenInFile.add(fileKey);

    const productId = productIdBySku.get(row.sku);
    if (!productId) {
      previewRows.push({
        ...row,
        status: "product_not_found",
        message: "Bu Ref kayıtlı değil",
      });
      continue;
    }

    if (!validTipNos.has(row.tipNo)) {
      previewRows.push({
        ...row,
        status: "vehicle_not_found",
        message: "Araç kataloğunda bu Id yok",
      });
      continue;
    }

    if (existingLinkKeys.has(linkKey(productId, row.tipNo))) {
      previewRows.push({
        ...row,
        status: "duplicate",
        message: "Bu üründe bu Id zaten kayıtlı",
      });
      continue;
    }

    previewRows.push({
      ...row,
      status: "ready",
    });
  }

  return previewRows;
}

export async function previewBulkVehicleCross(
  rows: BulkVehicleCrossRow[],
  parseErrors: BulkVehicleCrossParseError[] = [],
): Promise<BulkVehicleCrossImportResult> {
  const uniqueSkus = [...new Set(rows.map((row) => row.sku))];
  const products = uniqueSkus.length
    ? await db.product.findMany({
        where: {
          OR: uniqueSkus.map((sku) => ({ sku: { equals: sku, mode: "insensitive" as const } })),
        },
        select: { id: true, sku: true },
      })
    : [];
  const productIds = products.map((product) => product.id);
  const tipNos = [...new Set(rows.map((row) => row.tipNo))];

  const existingLinks =
    productIds.length && tipNos.length
      ? await db.productVehicleType.findMany({
          where: { productId: { in: productIds }, tipNo: { in: tipNos } },
          select: { productId: true, tipNo: true },
        })
      : [];

  const productIdBySku = new Map(
    products.map((product) => [product.sku.toUpperCase(), product.id]),
  );
  const existingLinkKeys = new Set(
    existingLinks.map((link) => linkKey(link.productId, link.tipNo)),
  );

  const previewRows = await buildPreviewRows(rows, existingLinkKeys);

  return summarize(previewRows, parseErrors, rows.length);
}

export async function importBulkVehicleCross(
  rows: BulkVehicleCrossRow[],
  parseErrors: BulkVehicleCrossParseError[] = [],
): Promise<BulkVehicleCrossImportResult> {
  const preview = await previewBulkVehicleCross(rows, parseErrors);
  const readyRows = preview.rows.filter((row) => row.status === "ready");

  if (!readyRows.length) {
    return preview;
  }

  const uniqueSkus = [...new Set(readyRows.map((row) => row.sku))];
  const products = await db.product.findMany({
    where: {
      OR: uniqueSkus.map((sku) => ({ sku: { equals: sku, mode: "insensitive" as const } })),
    },
    select: { id: true, sku: true },
  });
  const productIdBySku = new Map(
    products.map((product) => [product.sku.toUpperCase(), product.id]),
  );

  const createData = readyRows
    .map((row) => {
      const productId = productIdBySku.get(row.sku);
      if (!productId) return null;
      return { productId, tipNo: row.tipNo };
    })
    .filter((item): item is { productId: string; tipNo: number } => Boolean(item));

  if (createData.length) {
    await db.productVehicleType.createMany({
      data: createData,
      skipDuplicates: true,
    });
  }

  const updatedPreview = preview.rows.map((row) =>
    row.status === "ready" ? { ...row, status: "linked" as const, message: "Eklendi" } : row,
  );

  return summarize(updatedPreview, parseErrors, rows.length);
}

export async function getProductVehicleCrossLinkCount(): Promise<number> {
  return db.productVehicleType.count();
}

export async function clearAllProductVehicleCrossLinks(): Promise<{ deleted: number }> {
  const deleted = await db.productVehicleType.count();
  if (deleted === 0) {
    return { deleted: 0 };
  }
  await db.productVehicleType.deleteMany({});
  return { deleted };
}

function summarize(
  rows: BulkVehicleCrossPreviewRow[],
  parseErrors: BulkVehicleCrossParseError[],
  total: number,
): BulkVehicleCrossImportResult {
  return {
    linked: rows.filter((row) => row.status === "linked").length,
    duplicate: rows.filter((row) => row.status === "duplicate").length,
    productNotFound: rows.filter((row) => row.status === "product_not_found").length,
    vehicleNotFound: rows.filter((row) => row.status === "vehicle_not_found").length,
    invalid: parseErrors.length,
    total,
    rows,
    parseErrors,
  };
}
