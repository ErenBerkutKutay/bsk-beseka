import { db } from "@/lib/db";
import {
  defaultCatalogPdfSettings,
  type CatalogPdfSettingsData,
} from "@/lib/catalog/pdf-settings-defaults";

export type { CatalogPdfSettingsData } from "@/lib/catalog/pdf-settings-defaults";
export { defaultCatalogPdfSettings, parseHexColor } from "@/lib/catalog/pdf-settings-defaults";

export async function getCatalogPdfSettings(): Promise<CatalogPdfSettingsData> {
  const row = await db.catalogPdfSettings.findUnique({ where: { slug: "default" } });
  if (!row) {
    await db.catalogPdfSettings.create({
      data: { slug: "default", ...defaultCatalogPdfSettings },
    });
    return { id: "default", ...defaultCatalogPdfSettings };
  }

  return {
    id: row.id,
    logoUrl: row.logoUrl,
    headerBackgroundUrl: row.headerBackgroundUrl,
    headerBackgroundColor: row.headerBackgroundColor,
    headerHeightMm: row.headerHeightMm,
    documentTitle: row.documentTitle,
    tableHeaderColor: row.tableHeaderColor,
    isActive: row.isActive,
  };
}
