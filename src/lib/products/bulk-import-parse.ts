import { parseCodeList } from "@/lib/oem/normalize";

export type BulkProductRow = {
  line: number;
  sku: string;
  nameTr: string;
  descriptionTr?: string;
  categorySlug: string;
  oemCodes: string[];
  crossCodes: string[];
  images: string[];
  isNew: boolean;
  isActive: boolean;
};

export type BulkParseError = {
  line: number;
  message: string;
};

export type BulkImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors: BulkParseError[];
  rows: { sku: string; status: "created" | "updated" | "failed"; message?: string }[];
};

const HEADER_MAP: Record<string, keyof Omit<BulkProductRow, "line">> = {
  sku: "sku",
  beseka_sku: "sku",
  ref: "sku",
  ref_kodu: "sku",
  name: "nameTr",
  nametr: "nameTr",
  urun_adi: "nameTr",
  "ürün_adı": "nameTr",
  urun: "nameTr",
  description: "descriptionTr",
  descriptiontr: "descriptionTr",
  aciklama: "descriptionTr",
  açıklama: "descriptionTr",
  category: "categorySlug",
  categoryslug: "categorySlug",
  kategori: "categorySlug",
  oem: "oemCodes",
  oemcodes: "oemCodes",
  oem_kodlari: "oemCodes",
  oem_kodları: "oemCodes",
  cross: "crossCodes",
  crosscodes: "crossCodes",
  cross_kodlari: "crossCodes",
  cross_kodları: "crossCodes",
  images: "images",
  gorsel: "images",
  gorseller: "images",
  görseller: "images",
  image: "images",
  isnew: "isNew",
  yeni: "isNew",
  isactive: "isActive",
  aktif: "isActive",
};

function detectDelimiter(headerLine: string): ";" | "," | "\t" {
  const counts = {
    ";": (headerLine.match(/;/g) || []).length,
    ",": (headerLine.match(/,/g) || []).length,
    "\t": (headerLine.match(/\t/g) || []).length,
  };
  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] > counts[","]) return "\t";
  return ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseList(value: string): string[] {
  if (!value) return [];
  if (value.includes("|")) {
    return value.split("|").map((s) => s.trim()).filter(Boolean);
  }
  return parseCodeList(value);
}

function parseBool(value: string, defaultValue: boolean): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return defaultValue;
  if (["1", "true", "evet", "yes", "e"].includes(v)) return true;
  if (["0", "false", "hayir", "hayır", "no", "h"].includes(v)) return false;
  return defaultValue;
}

export function parseBulkProductCsv(content: string): {
  rows: BulkProductRow[];
  errors: BulkParseError[];
} {
  const text = content.replace(/^\uFEFF/, "").trim();
  if (!text) return { rows: [], errors: [{ line: 0, message: "Dosya boş" }] };

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { rows: [], errors: [{ line: 0, message: "En az başlık satırı ve bir veri satırı gerekli" }] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_"),
  );

  const columnIndex: Partial<Record<keyof Omit<BulkProductRow, "line">, number>> = {};
  headers.forEach((header, index) => {
    const key = HEADER_MAP[header];
    if (key) columnIndex[key] = index;
  });

  if (columnIndex.sku === undefined || columnIndex.nameTr === undefined || columnIndex.categorySlug === undefined) {
    return {
      rows: [],
      errors: [{
        line: 1,
        message: "Zorunlu sütunlar eksik: sku, urun_adi (veya name), kategori (veya category)",
      }],
    };
  }

  const rows: BulkProductRow[] = [];
  const errors: BulkParseError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const cells = splitCsvLine(lines[i], delimiter);
    if (cells.every((c) => !c)) continue;

    const get = (key: keyof Omit<BulkProductRow, "line">) => {
      const idx = columnIndex[key];
      return idx !== undefined ? (cells[idx] || "").trim() : "";
    };

    const sku = get("sku");
    const nameTr = get("nameTr");
    const categorySlug = get("categorySlug");

    if (!sku) {
      errors.push({ line: lineNum, message: "SKU boş" });
      continue;
    }
    if (!nameTr) {
      errors.push({ line: lineNum, message: `${sku}: Ürün adı boş` });
      continue;
    }
    if (!categorySlug) {
      errors.push({ line: lineNum, message: `${sku}: Kategori boş` });
      continue;
    }

    rows.push({
      line: lineNum,
      sku: sku.toUpperCase(),
      nameTr,
      descriptionTr: get("descriptionTr") || undefined,
      categorySlug: categorySlug.toLowerCase(),
      oemCodes: parseList(get("oemCodes")),
      crossCodes: parseList(get("crossCodes")),
      images: parseList(get("images")),
      isNew: parseBool(get("isNew"), false),
      isActive: parseBool(get("isActive"), true),
    });
  }

  return { rows, errors };
}

export const BULK_PRODUCT_CSV_TEMPLATE = `sku;urun_adi;aciklama;kategori;oem_kodlari;cross_kodlari;gorseller;yeni;aktif
B8376;Motor Takozu Ön;Ön motor takozu;motor-takozlari;12 34-56.78|77 888-99;CROSS1|CROSS2;/beseka/products/b8376.jpg;evet;evet
B6850;Motor Takozu Arka;Arka motor takozu;motor-takozlari;98 76-54.32;;/beseka/products/b6850.jpg;hayir;evet`;
