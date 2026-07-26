import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CatalogPdfSettingsData } from "@/lib/catalog/pdf-settings-defaults";
import { parseHexColor } from "@/lib/catalog/pdf-settings-defaults";
import { isValidVehicleTipNo } from "@/lib/catalog/fitment-display";
import { getLocalizedText } from "@/lib/utils";
import { registerTurkishPdfFont, TURKISH_PDF_FONT, turkishPdfTableFont } from "@/lib/pdf/turkish-pdf-font";

export type CatalogExportProduct = {
  sku: string;
  name: Record<string, string>;
  images: string[];
  category?: { name: Record<string, string>; slug: string } | null;
  oemCodes?: { code: string }[];
  vehicleTypes?: {
    vehicleType: {
      tipNo?: number | null;
      make: string;
      modelSeries: string;
      typeName: string;
      yearFrom?: number | null;
      yearTo?: number | null;
    };
  }[];
};

type FitmentRow = {
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
};

type PdfTableRow = {
  sku: string;
  oem: string;
  imageUrl: string;
  fitments: FitmentRow[];
};

function resolveSiteOrigin(requestOrigin?: string) {
  return (
    requestOrigin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "http://localhost:8008"
  ).replace(/\/$/, "");
}

function toAbsoluteUrl(path: string, origin: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function mapProductRow(product: CatalogExportProduct, origin: string, includeImages: boolean) {
  const name = getLocalizedText(product.name, "tr");
  const category = product.category
    ? getLocalizedText(product.category.name, "tr") || product.category.slug
    : "";
  const oem = (product.oemCodes || []).map((c) => c.code).join(" | ");
  const vehicles = buildFitmentRows(product)
    .map((v) => `${v.make} / ${v.model} (${v.yearFrom} - ${v.yearTo})`)
    .join(" | ");
  const image = product.images[0] ? toAbsoluteUrl(product.images[0], origin) : "";

  return {
    Ref: product.sku,
    "Ürün Adı": name,
    Kategori: category,
    "OEM Kodları": oem,
    "Araç Uyumu": vehicles,
    ...(includeImages ? { Görsel: image } : {}),
  };
}

function buildFitmentRows(product: CatalogExportProduct): FitmentRow[] {
  const rows: FitmentRow[] = [];
  const seen = new Set<number>();

  for (const link of product.vehicleTypes ?? []) {
    const vt = link.vehicleType;
    if (!isValidVehicleTipNo(vt.tipNo) || seen.has(vt.tipNo)) continue;

    seen.add(vt.tipNo);
    rows.push({
      make: vt.make || "—",
      model: [vt.modelSeries, vt.typeName].filter(Boolean).join(" / ") || "—",
      yearFrom: vt.yearFrom ? String(vt.yearFrom) : "—",
      yearTo: vt.yearTo ? String(vt.yearTo) : "—",
    });
  }

  if (!rows.length) {
    rows.push({ make: "—", model: "—", yearFrom: "—", yearTo: "—" });
  }

  return rows;
}

function buildPdfTableRows(products: CatalogExportProduct[], origin: string): PdfTableRow[] {
  return products.map((product) => ({
    sku: product.sku,
    oem: (product.oemCodes || []).map((c) => c.code).join("\n") || "—",
    imageUrl: product.images[0] ? toAbsoluteUrl(product.images[0], origin) : "",
    fitments: buildFitmentRows(product),
  }));
}

export function buildCatalogExcelBuffer(
  products: CatalogExportProduct[],
  options: { includeImages: boolean; origin: string },
): Buffer {
  const rows = products.map((p) => mapProductRow(p, options.origin, options.includeImages));
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 12 },
    { wch: 42 },
    { wch: 22 },
    { wch: 28 },
    { wch: 36 },
    ...(options.includeImages ? [{ wch: 48 }] : []),
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Katalog");
  return Buffer.from(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));
}

async function fetchImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > 2_000_000) return null;
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function imageFormatFromDataUrl(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "JPEG";
}

async function preloadImageMap(rows: PdfTableRow[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const urls = [...new Set(rows.map((r) => r.imageUrl).filter(Boolean))];
  const batchSize = 25;

  for (let index = 0; index < urls.length; index += batchSize) {
    const batch = urls.slice(index, index + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        const dataUrl = await fetchImageDataUrl(url);
        if (dataUrl) map.set(url, dataUrl);
      }),
    );
  }

  return map;
}

function drawPdfHeader(
  doc: jsPDF,
  settings: CatalogPdfSettingsData,
  assets: { logo?: string | null; headerBackground?: string | null },
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = settings.headerHeightMm;
  const [r, g, b] = parseHexColor(settings.headerBackgroundColor);

  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  if (assets.headerBackground) {
    const format = imageFormatFromDataUrl(assets.headerBackground);
    doc.addImage(assets.headerBackground, format, 0, 0, pageWidth, headerHeight, undefined, "FAST");
  }

  if (assets.logo) {
    const format = imageFormatFromDataUrl(assets.logo);
    const logoHeight = Math.max(10, headerHeight - 10);
    const logoWidth = logoHeight * 2.8;
    doc.addImage(assets.logo, format, 8, (headerHeight - logoHeight) / 2, logoWidth, logoHeight, undefined, "FAST");
  }
}

export async function buildCatalogPdfBuffer(
  products: CatalogExportProduct[],
  options: { origin: string; settings: CatalogPdfSettingsData; includeImages?: boolean },
): Promise<Buffer> {
  const { settings } = options;
  const includeImages = options.includeImages !== false;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerTurkishPdfFont(doc);

  const tableRows = buildPdfTableRows(products, options.origin);
  const imageMap = includeImages ? await preloadImageMap(tableRows) : new Map<string, string>();
  const logoUrl = toAbsoluteUrl(settings.logoUrl, options.origin);
  const headerBgUrl = settings.headerBackgroundUrl
    ? toAbsoluteUrl(settings.headerBackgroundUrl, options.origin)
    : "";

  const [logoData, headerBgData] = await Promise.all([
    fetchImageDataUrl(logoUrl),
    headerBgUrl ? fetchImageDataUrl(headerBgUrl) : Promise.resolve(null),
  ]);

  const headerAssets = { logo: logoData, headerBackground: headerBgData };
  const generatedAt = new Date().toLocaleString("tr-TR");
  const contentTop = settings.headerHeightMm + 12;
  const tableHeaderRgb = parseHexColor(settings.tableHeaderColor);

  type BodyCell = string | { content: string; rowSpan?: number; styles?: Record<string, unknown> };
  const body: BodyCell[][] = [];
  const bodyRowProductIndex: number[] = [];

  tableRows.forEach((row, productIndex) => {
    row.fitments.forEach((fitment, fitmentIndex) => {
      bodyRowProductIndex.push(productIndex);

      if (fitmentIndex === 0) {
        body.push([
          { content: "", rowSpan: row.fitments.length },
          { content: row.sku, rowSpan: row.fitments.length, styles: { fontStyle: "bold" } },
          { content: row.oem, rowSpan: row.fitments.length },
          fitment.make,
          fitment.model,
          fitment.yearFrom,
          fitment.yearTo,
        ]);
      } else {
        body.push([fitment.make, fitment.model, fitment.yearFrom, fitment.yearTo]);
      }
    });
  });

  autoTable(doc, {
    startY: contentTop + 10,
    head: [["Görsel", "Beseka Kodu", "OEM", "Marka", "Model", "Başlangıç Yılı", "Bitiş Yılı"]],
    body,
    styles: {
      ...turkishPdfTableFont,
      fontSize: 7,
      cellPadding: 2,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      ...turkishPdfTableFont,
      fillColor: tableHeaderRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 22, minCellHeight: 18 },
      1: { cellWidth: 22, fontStyle: "bold" },
      2: { cellWidth: 32 },
      3: { cellWidth: 22 },
      4: { cellWidth: 38 },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { top: contentTop + 10, left: 8, right: 8 },
    didDrawPage: (data) => {
      drawPdfHeader(doc, settings, headerAssets);

      if (data.pageNumber === 1) {
        doc.setFontSize(14);
        doc.setFont(TURKISH_PDF_FONT, "bold");
        doc.setTextColor(0);
        doc.text(settings.documentTitle, 14, settings.headerHeightMm + 6);

        doc.setFontSize(8);
        doc.setFont(TURKISH_PDF_FONT, "normal");
        doc.setTextColor(100);
        doc.text(`Oluşturulma: ${generatedAt} · ${products.length} ürün`, 14, settings.headerHeightMm + 11);
        doc.setTextColor(0);
      }
    },
    didDrawCell: (data) => {
      if (!includeImages || data.section !== "body" || data.column.index !== 0) return;

      const productIndex = bodyRowProductIndex[data.row.index];
      const productRow = tableRows[productIndex];
      if (!productRow?.imageUrl) return;

      const dataUrl = imageMap.get(productRow.imageUrl);
      const size = Math.min(data.cell.width - 4, data.cell.height - 4, 18);

      if (dataUrl) {
        const format = imageFormatFromDataUrl(dataUrl);
        doc.addImage(
          dataUrl,
          format,
          data.cell.x + (data.cell.width - size) / 2,
          data.cell.y + (data.cell.height - size) / 2,
          size,
          size,
          undefined,
          "FAST",
        );
      } else {
        doc.setFontSize(6);
        doc.setFont(TURKISH_PDF_FONT, "normal");
        doc.text(productRow.sku.slice(0, 10), data.cell.x + 3, data.cell.y + data.cell.height / 2);
      }
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export function catalogExportFilename(format: "excel" | "pdf") {
  const stamp = new Date().toISOString().slice(0, 10);
  return format === "excel" ? `beseka-katalog-${stamp}.xlsx` : `beseka-katalog-${stamp}.pdf`;
}

export { resolveSiteOrigin };
