import { db } from "@/lib/db";
import { saveImageBuffer } from "@/lib/media/save-image";
import {
  slugFromCategoryImageFilename,
  type BulkCategoryImageImportRow,
  type BulkCategoryImagePreviewRow,
} from "./bulk-category-image-match";

export { slugFromCategoryImageFilename } from "./bulk-category-image-match";
export type {
  BulkCategoryImageImportRow,
  BulkCategoryImagePreviewRow,
} from "./bulk-category-image-match";

export async function previewBulkCategoryImages(
  filenames: string[],
  options?: { skipExisting?: boolean },
): Promise<BulkCategoryImagePreviewRow[]> {
  const skipExisting = options?.skipExisting ?? false;
  const rows: BulkCategoryImagePreviewRow[] = [];
  const seenSlugs = new Map<string, string>();

  for (const filename of filenames) {
    const slug = slugFromCategoryImageFilename(filename);
    if (!slug) {
      rows.push({
        filename,
        slug: null,
        status: "invalid_name",
        message: "Dosya adı motor-takozlari.jpg formatında olmalı",
      });
      continue;
    }

    if (seenSlugs.has(slug)) {
      rows.push({
        filename,
        slug,
        status: "invalid_name",
        message: `Aynı slug tekrar ediyor (${seenSlugs.get(slug)})`,
      });
      continue;
    }
    seenSlugs.set(slug, filename);

    const category = await db.category.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, image: true },
    });

    if (!category) {
      rows.push({
        filename,
        slug,
        status: "not_found",
        message: "Bu slug ile kategori bulunamadı",
      });
      continue;
    }

    const categoryName = (category.name as { tr?: string })?.tr || category.slug;

    if (skipExisting && category.image) {
      rows.push({
        filename,
        slug,
        status: "skipped",
        message: "Kategorinin zaten görseli var",
        categoryId: category.id,
        categoryName,
        hasImage: true,
      });
      continue;
    }

    rows.push({
      filename,
      slug,
      status: "ready",
      categoryId: category.id,
      categoryName,
      hasImage: !!category.image,
    });
  }

  return rows;
}

export async function importBulkCategoryImage(
  file: { filename: string; buffer: Buffer; mimeType: string },
  options?: { skipExisting?: boolean },
): Promise<BulkCategoryImageImportRow> {
  const skipExisting = options?.skipExisting ?? false;
  const slug = slugFromCategoryImageFilename(file.filename);

  if (!slug) {
    return {
      filename: file.filename,
      slug: "",
      status: "invalid_name",
      message: "Dosya adı motor-takozlari.jpg formatında olmalı",
    };
  }

  const category = await db.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, image: true },
  });

  if (!category) {
    return {
      filename: file.filename,
      slug,
      status: "not_found",
      message: "Bu slug ile kategori bulunamadı",
    };
  }

  const categoryName = (category.name as { tr?: string })?.tr || category.slug;

  if (skipExisting && category.image) {
    return {
      filename: file.filename,
      slug,
      status: "skipped",
      message: "Kategorinin zaten görseli var",
      categoryName,
    };
  }

  try {
    const { url } = await saveImageBuffer(
      file.buffer,
      file.filename,
      file.mimeType,
      categoryName,
    );

    await db.category.update({
      where: { id: category.id },
      data: { image: url },
    });

    return {
      filename: file.filename,
      slug,
      status: "updated",
      imageUrl: url,
      categoryName,
    };
  } catch (err) {
    return {
      filename: file.filename,
      slug,
      status: "failed",
      message: err instanceof Error ? err.message : "Yükleme başarısız",
      categoryName,
    };
  }
}
