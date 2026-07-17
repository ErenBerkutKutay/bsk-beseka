import { db } from "@/lib/db";
import { saveImageBuffer } from "@/lib/media/save-image";
import {
  skuFromImageFilename,
  type BulkImageImportRow,
  type BulkImagePreviewRow,
} from "./bulk-image-match";

export { skuFromImageFilename } from "./bulk-image-match";
export type { BulkImageImportRow, BulkImagePreviewRow } from "./bulk-image-match";

export async function previewBulkProductImages(
  filenames: string[],
  options?: { skipExisting?: boolean },
): Promise<BulkImagePreviewRow[]> {
  const skipExisting = options?.skipExisting ?? false;
  const rows: BulkImagePreviewRow[] = [];
  const seenSkus = new Map<string, string>();

  for (const filename of filenames) {
    const sku = skuFromImageFilename(filename);
    if (!sku) {
      rows.push({
        filename,
        sku: null,
        status: "invalid_name",
        message: "Dosya adı B8376.jpg formatında olmalı",
      });
      continue;
    }

    if (seenSkus.has(sku)) {
      rows.push({
        filename,
        sku,
        status: "invalid_name",
        message: `Aynı Ref tekrar ediyor (${seenSkus.get(sku)})`,
      });
      continue;
    }
    seenSkus.set(sku, filename);

    const product = await db.product.findUnique({
      where: { sku },
      select: { id: true, sku: true, name: true, images: true },
    });

    if (!product) {
      rows.push({
        filename,
        sku,
        status: "not_found",
        message: "Bu Ref ile kayıtlı ürün bulunamadı",
      });
      continue;
    }

    const name = (product.name as { tr?: string })?.tr || product.sku;
    const hasImages = product.images.length > 0;

    if (skipExisting && hasImages) {
      rows.push({
        filename,
        sku,
        status: "skipped",
        message: "Ürünün zaten görseli var",
        productId: product.id,
        productName: name,
        hasImages,
      });
      continue;
    }

    rows.push({
      filename,
      sku,
      status: "ready",
      productId: product.id,
      productName: name,
      hasImages,
    });
  }

  return rows;
}

export async function importBulkProductImage(
  file: { filename: string; buffer: Buffer; mimeType: string },
  options?: { append?: boolean; skipExisting?: boolean },
): Promise<BulkImageImportRow> {
  const append = options?.append ?? false;
  const skipExisting = options?.skipExisting ?? false;
  const sku = skuFromImageFilename(file.filename);

  if (!sku) {
    return {
      filename: file.filename,
      sku: "",
      status: "invalid_name",
      message: "Dosya adı B8376.jpg formatında olmalı",
    };
  }

  const product = await db.product.findUnique({
    where: { sku },
    select: { id: true, sku: true, name: true, images: true },
  });

  if (!product) {
    return {
      filename: file.filename,
      sku,
      status: "not_found",
      message: "Bu Ref ile kayıtlı ürün bulunamadı",
    };
  }

  const productName = (product.name as { tr?: string })?.tr || product.sku;

  if (skipExisting && product.images.length > 0) {
    return {
      filename: file.filename,
      sku,
      status: "skipped",
      message: "Ürünün zaten görseli var",
      productName,
    };
  }

  try {
    const { url } = await saveImageBuffer(file.buffer, file.filename, file.mimeType, productName);
    const images = append ? [...product.images, url] : [url];

    await db.product.update({
      where: { id: product.id },
      data: { images },
    });

    return {
      filename: file.filename,
      sku,
      status: "updated",
      imageUrl: url,
      productName,
    };
  } catch (err) {
    return {
      filename: file.filename,
      sku,
      status: "failed",
      message: err instanceof Error ? err.message : "Yükleme başarısız",
      productName,
    };
  }
}
