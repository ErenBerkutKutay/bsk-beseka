import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getLocalizedText } from "@/lib/utils";
import { buildVehicleDisplayRows } from "@/lib/catalog/fitment-display";
import { registerTurkishPdfFont, TURKISH_PDF_FONT, turkishPdfTableFont } from "@/lib/pdf/turkish-pdf-font";

export type CatalogExportProduct = {
  sku: string;
  name: Record<string, string>;
  images: string[];
  category?: { name: Record<string, string>; slug: string } | null;
  oemCodes?: { code: string }[];
  crossCodes?: { code: string }[];
  vehicleTypes?: {
    vehicleType: {
      make: string;
      modelSeries: string;
      typeName: string;
      yearFrom?: number | null;
      yearTo?: number | null;
    };
  }[];
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
  const cross = (product.crossCodes || []).map((c) => c.code).join(" | ");
  const vehicles = buildVehicleDisplayRows(product)
    .map((v) => `${v.makeModel} (${v.yearLabel})`)
    .join(" | ");
  const image = product.images[0] ? toAbsoluteUrl(product.images[0], origin) : "";

  return {
    Ref: product.sku,
    "Ürün Adı": name,
    Kategori: category,
    "OEM Kodları": oem,
    "Cross Kodları": cross,
    "Araç Uyumu": vehicles,
    ...(includeImages ? { Görsel: image } : {}),
  };
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
    { wch: 24 },
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

export async function buildCatalogPdfBuffer(
  products: CatalogExportProduct[],
  options: { includeImages: boolean; origin: string },
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerTurkishPdfFont(doc);
  const generatedAt = new Date().toLocaleString("tr-TR");

  doc.setFontSize(16);
  doc.setFont(TURKISH_PDF_FONT, "bold");
  doc.text("Beseka Ürün Kataloğu", 14, 16);
  doc.setFontSize(9);
  doc.setFont(TURKISH_PDF_FONT, "normal");
  doc.setTextColor(100);
  doc.text(`Oluşturulma: ${generatedAt} · ${products.length} ürün`, 14, 22);
  doc.setTextColor(0);

  if (!options.includeImages) {
    const body = products.map((product) => {
      const row = mapProductRow(product, options.origin, false);
      return [row.Ref, row["Ürün Adı"], row.Kategori, row["OEM Kodları"], row["Cross Kodları"]];
    });

    autoTable(doc, {
      startY: 28,
      head: [["Ref", "Ürün Adı", "Kategori", "OEM", "Cross"]],
      body,
      styles: { ...turkishPdfTableFont, fontSize: 7, cellPadding: 1.5 },
      headStyles: { ...turkishPdfTableFont, fillColor: [139, 69, 19] },
      margin: { left: 10, right: 10 },
    });
  } else {
    let y = 30;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const row = mapProductRow(product, options.origin, true);
      const blockHeight = 46;

      if (y + blockHeight > pageHeight - 12) {
        doc.addPage();
        y = 16;
      }

      const imageUrl = product.images[0] ? toAbsoluteUrl(product.images[0], options.origin) : "";
      const dataUrl = imageUrl ? await fetchImageDataUrl(imageUrl) : null;

      if (dataUrl) {
        const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(dataUrl, format, margin, y, 28, 28);
      } else {
        doc.rect(margin, y, 28, 28);
        doc.setFontSize(8);
        doc.setFont(TURKISH_PDF_FONT, "normal");
        doc.text(product.sku.slice(0, 8), margin + 4, y + 16);
      }

      doc.setFontSize(10);
      doc.setFont(TURKISH_PDF_FONT, "bold");
      doc.text(`${row.Ref} — ${row["Ürün Adı"].slice(0, 70)}`, margin + 32, y + 6);
      doc.setFont(TURKISH_PDF_FONT, "normal");
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(
        `Kategori: ${row.Kategori || "—"}\nOEM: ${row["OEM Kodları"] || "—"}\nCross: ${row["Cross Kodları"] || "—"}`,
        150,
      );
      doc.text(lines, margin + 32, y + 12);

      y += blockHeight + 4;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export function catalogExportFilename(format: "excel" | "pdf") {
  const stamp = new Date().toISOString().slice(0, 10);
  return format === "excel" ? `beseka-katalog-${stamp}.xlsx` : `beseka-katalog-${stamp}.pdf`;
}

export { resolveSiteOrigin };
