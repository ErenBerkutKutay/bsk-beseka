export function slugFromCategoryImageFilename(filename: string): string | null {
  const base = filename.split(/[/\\]/).pop() || filename;
  const match = base.match(/^(.+)\.(jpe?g|png|webp|gif)$/i);
  if (!match) return null;
  return match[1].trim().toLowerCase();
}

export type BulkCategoryImagePreviewRow = {
  filename: string;
  slug: string | null;
  status: "ready" | "invalid_name" | "not_found" | "skipped";
  message?: string;
  categoryId?: string;
  categoryName?: string;
  hasImage?: boolean;
};

export type BulkCategoryImageImportRow = {
  filename: string;
  slug: string;
  status: "updated" | "skipped" | "not_found" | "invalid_name" | "failed";
  message?: string;
  imageUrl?: string;
  categoryName?: string;
};
