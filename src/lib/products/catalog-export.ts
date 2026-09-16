import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CatalogPdfSettingsData } from "@/lib/catalog/pdf-settings-defaults";
import { parseHexColor } from "@/lib/catalog/pdf-settings-defaults";
import {
  buildProductVehicleRows,
  isValidVehicleTipNo,
} from "@/lib/catalog/fitment-display";
import { getLocalizedText } from "@/lib/utils";
import { registerTurkishPdfFont, TURKISH_PDF_FONT, turkishPdfTableFont } from "@/lib/pdf/turkish-pdf-font";

export type CatalogExportProduct = {
  sku: string;
  name: Record<string, string>;
  description?: Record<string, string> | null;
  description2?: Record<string, string> | null;
  description3?: Record<string, string> | null;
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

const PDF_LIST_LIMIT = 5;
const PDF_MAKE_MODEL_MAX_CHARS = 50;

const PDF_COLUMN_WIDTHS = {
  image: 22,
  sku: 22,
  oem: 32,
  make: 22,
  model: 40,
  modelYear: 22,
} as const;

type PdfTableRow = {
  sku: string;
  oem: string;
  makes: string;
  models: string;
  modelYears: string;
  imageUrl: string;
};

function tintHexColor(hex: string, amount: number): [number, number, number] {
  const [r, g, b] = parseHexColor(hex);
  const mix = Math.min(1, Math.max(0, amount));
  return [
    Math.round(r * mix + 255 * (1 - mix)),
    Math.round(g * mix + 255 * (1 - mix)),
    Math.round(b * mix + 255 * (1 - mix)),
  ];
}

function formatLimitedLines(lines: string[]): string {
  if (!lines.length) return "—";
  const shown = lines.slice(0, PDF_LIST_LIMIT);
  let text = shown.join("\n");
  if (lines.length > PDF_LIST_LIMIT) {
    text += "\nDAHA FAZLA BİLGİ";
  }
  return text;
}

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

function collectFitmentRows(product: CatalogExportProduct): FitmentRow[] {
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

  return rows;
}

function buildFitmentRows(product: CatalogExportProduct): FitmentRow[] {
  const rows = collectFitmentRows(product);
  if (!rows.length) {
    rows.push({ make: "—", model: "—", yearFrom: "—", yearTo: "—" });
  }
  return rows;
}

function buildPdfTableRows(products: CatalogExportProduct[], origin: string): PdfTableRow[] {
  return products.map((product) => {
    const oemCodes = (product.oemCodes || []).map((c) => c.code);
    const { rows, hasMore } = buildProductVehicleRows(product, "tr", {
      limit: PDF_LIST_LIMIT,
      truncateModelChars: PDF_MAKE_MODEL_MAX_CHARS,
    });

    let makes = rows.length ? rows.map((row) => row.make).join("\n") : "—";
    let models = rows.length ? rows.map((row) => row.model).join("\n") : "—";
    const modelYears = rows.length ? rows.map((row) => row.yearLabel).join("\n") : "—";

    if (hasMore) {
      makes += "\nDAHA FAZLA BİLGİ";
    }

    return {
      sku: product.sku,
      oem: formatLimitedLines(oemCodes),
      makes,
      models,
      modelYears,
      imageUrl: product.images[0] ? toAbsoluteUrl(product.images[0], origin) : "",
    };
  });
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
  const productCodeRgb = parseHexColor(settings.headerBackgroundColor);
  const productCodeBgRgb = tintHexColor(settings.headerBackgroundColor, 0.12);
  const productRowAltRgb: [number, number, number] = [248, 248, 248];
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = Object.values(PDF_COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0);
  const sideMargin = Math.max(8, (pageWidth - tableWidth) / 2);

  const body = tableRows.map((row) => ["", row.sku, row.oem, row.makes, row.models, row.modelYears]);

  autoTable(doc, {
    startY: contentTop + 10,
    head: [["Görsel", "Beseka Kodu", "OEM", "Marka", "Model", "Model Yılı"]],
    body,
    tableWidth,
    styles: {
      ...turkishPdfTableFont,
      fontSize: 7,
      cellPadding: 2.5,
      valign: "middle",
      overflow: "linebreak",
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
    },
    headStyles: {
      ...turkishPdfTableFont,
      fillColor: tableHeaderRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: PDF_COLUMN_WIDTHS.image, minCellHeight: 22 },
      1: { cellWidth: PDF_COLUMN_WIDTHS.sku, fontStyle: "bold", halign: "center" },
      2: { cellWidth: PDF_COLUMN_WIDTHS.oem },
      3: { cellWidth: PDF_COLUMN_WIDTHS.make },
      4: { cellWidth: PDF_COLUMN_WIDTHS.model, halign: "right", overflow: "hidden" },
      5: { cellWidth: PDF_COLUMN_WIDTHS.modelYear, halign: "center" },
    },
    margin: { top: contentTop + 10, left: sideMargin, right: sideMargin },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 4) {
        data.cell.styles.halign = "right";
        return;
      }

      if (data.section !== "body") return;

      const rowIndex = data.row.index;
      const isAltRow = rowIndex % 2 === 1;
      const baseFill: [number, number, number] = isAltRow ? productRowAltRgb : [255, 255, 255];

      if (data.column.index === 1) {
        data.cell.styles.fillColor = productCodeBgRgb;
        data.cell.styles.textColor = productCodeRgb;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 8;
      } else {
        data.cell.styles.fillColor = baseFill;
      }

      data.cell.styles.lineWidth = {
        top: 0.2,
        right: 0.2,
        bottom: 0.6,
        left: 0.2,
      };
    },
    didDrawPage: (data) => {
      drawPdfHeader(doc, settings, headerAssets);

      if (data.pageNumber === 1) {
        doc.setFontSize(14);
        doc.setFont(TURKISH_PDF_FONT, "bold");
        doc.setTextColor(0);
        doc.text(settings.documentTitle, pageWidth / 2, settings.headerHeightMm + 6, { align: "center" });

        doc.setFontSize(8);
        doc.setFont(TURKISH_PDF_FONT, "normal");
        doc.setTextColor(100);
        doc.text(
          `Oluşturulma: ${generatedAt} · ${products.length} ürün`,
          pageWidth / 2,
          settings.headerHeightMm + 11,
          { align: "center" },
        );
        doc.setTextColor(0);
      }
    },
    didDrawCell: (data) => {
      if (data.section !== "body") return;

      if (includeImages && data.column.index === 0) {
        const productRow = tableRows[data.row.index];
        if (!productRow?.imageUrl) return;

        const dataUrl = imageMap.get(productRow.imageUrl);
        const size = Math.min(data.cell.width - 4, data.cell.height - 4, 20);

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
          doc.setTextColor(120);
          doc.text(productRow.sku.slice(0, 10), data.cell.x + 3, data.cell.y + data.cell.height / 2);
          doc.setTextColor(0);
        }
        return;
      }

      if (data.column.index === 1) {
        doc.setDrawColor(...productCodeRgb);
        doc.setLineWidth(0.35);
        doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
        doc.line(
          data.cell.x + data.cell.width,
          data.cell.y,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height,
        );
        return;
      }

      if (data.column.index === 4) {
        doc.setDrawColor(...productCodeRgb);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
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
