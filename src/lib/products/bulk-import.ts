import { db } from "@/lib/db";
import { buildOEMEntries } from "@/lib/oem/normalize";
import type { Prisma } from "@/generated/prisma/client";
import slugify from "slugify";
import type { BulkImportResult, BulkProductRow } from "./bulk-import-parse";

export type { BulkImportResult, BulkParseError, BulkProductRow } from "./bulk-import-parse";
export { BULK_PRODUCT_CSV_TEMPLATE, parseBulkProductCsv } from "./bulk-import-parse";
export { createBulkProductExcelBuffer, excelBufferToCsv } from "./bulk-import-excel";

function buildSlug(sku: string, name: string) {
  return slugify(`${sku}-${name}`, { lower: true, strict: true });
}

export async function importBulkProducts(
  rows: BulkProductRow[],
  options?: { updateExisting?: boolean },
): Promise<BulkImportResult> {
  const updateExisting = options?.updateExisting ?? true;
  const result: BulkImportResult = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
    rows: [],
  };

  const categories = await db.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const row of rows) {
    const categoryId = categoryBySlug.get(row.categorySlug);
    if (!categoryId) {
      result.failed++;
      result.errors.push({
        line: row.line,
        message: `${row.sku}: Kategori bulunamadı (${row.categorySlug})`,
      });
      result.rows.push({ sku: row.sku, status: "failed", message: "Kategori bulunamadı" });
      continue;
    }

    try {
      const name: Prisma.InputJsonValue = { tr: row.nameTr };
      const description: Prisma.InputJsonValue | undefined = row.descriptionTr
        ? { tr: row.descriptionTr }
        : undefined;

      const existing = await db.product.findUnique({ where: { sku: row.sku } });

      if (existing) {
        if (!updateExisting) {
          result.failed++;
          result.errors.push({
            line: row.line,
            message: `${row.sku}: Bu Ref zaten kayıtlı. Mevcut ürünü düzenleyin veya "Mevcut Ref'leri güncelle" seçeneğini işaretleyin.`,
          });
          result.rows.push({ sku: row.sku, status: "failed", message: "Ref zaten var" });
          continue;
        }

        await db.oEMCode.deleteMany({ where: { productId: existing.id } });
        await db.crossCode.deleteMany({ where: { productId: existing.id } });

        await db.product.update({
          where: { id: existing.id },
          data: {
            slug: buildSlug(row.sku, row.nameTr),
            name,
            description,
            categoryId,
            isNew: row.isNew,
            isFeatured: row.isNew,
            isActive: row.isActive,
            oemCodes: { create: buildOEMEntries(row.oemCodes) },
            crossCodes: {
              create: buildOEMEntries(row.crossCodes).map((e) => ({ ...e, brand: null })),
            },
          },
        });

        result.updated++;
        result.rows.push({ sku: row.sku, status: "updated" });
      } else {
        await db.product.create({
          data: {
            sku: row.sku,
            slug: buildSlug(row.sku, row.nameTr),
            name,
            description,
            categoryId,
            images: [],
            isNew: row.isNew,
            isFeatured: row.isNew,
            isActive: row.isActive,
            oemCodes: { create: buildOEMEntries(row.oemCodes) },
            crossCodes: {
              create: buildOEMEntries(row.crossCodes).map((e) => ({ ...e, brand: null })),
            },
          },
        });

        result.created++;
        result.rows.push({ sku: row.sku, status: "created" });
      }
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      result.errors.push({ line: row.line, message: `${row.sku}: ${message}` });
      result.rows.push({ sku: row.sku, status: "failed", message });
    }
  }

  return result;
}
