export function skuFromImageFilename(filename: string): string | null {
  const base = filename.split(/[/\\]/).pop() || filename;
  const match = base.match(/^(.+)\.(jpe?g|png|webp|gif)$/i);
  if (!match) return null;
  return match[1].trim().toUpperCase();
}

export type BulkImagePreviewRow = {
  filename: string;
  sku: string | null;
  status: "ready" | "invalid_name" | "not_found" | "skipped";
  message?: string;
  productId?: string;
  productName?: string;
  hasImages?: boolean;
};

export type BulkImageImportRow = {
  filename: string;
  sku: string;
  status: "updated" | "skipped" | "not_found" | "invalid_name" | "failed";
  message?: string;
  imageUrl?: string;
  productName?: string;
};
