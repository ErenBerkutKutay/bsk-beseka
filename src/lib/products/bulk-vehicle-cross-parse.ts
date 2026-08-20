import * as XLSX from "xlsx";

export type BulkVehicleCrossRow = {
  line: number;
  sku: string;
  tipNo: number;
};

export type BulkVehicleCrossParseError = {
  line: number;
  message: string;
};

const HEADER_SKU = new Set([
  "ref",
  "sku",
  "beseka_ref",
  "besekaref",
  "urun_kodu",
  "ürün_kodu",
  "product",
  "product_code",
  "kod",
]);

const HEADER_TIP = new Set([
  "vehicle_id",
  "vehicleid",
  "id",
  "tip_no",
  "tipno",
  "arac_id",
  "araç_id",
  "arac_kodu",
]);

export const BULK_VEHICLE_CROSS_CSV_TEMPLATE = `ref;vehicle_id
B2510;12345
B2510;67890
B8376;44556
`;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

function isHeaderRow(skuCell: string, tipCell: string) {
  const skuHeader = normalizeHeader(skuCell);
  const tipHeader = normalizeHeader(tipCell);
  return HEADER_SKU.has(skuHeader) && HEADER_TIP.has(tipHeader);
}

function parseTipNo(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const num = parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function parseRowPair(line: number, skuCell: string, tipCell: string): {
  row?: BulkVehicleCrossRow;
  error?: BulkVehicleCrossParseError;
  skip?: boolean;
} {
  const sku = skuCell.trim().toUpperCase();
  const tipNo = parseTipNo(tipCell);

  if (!sku && !tipCell.trim()) {
    return { skip: true };
  }

  if (isHeaderRow(skuCell, tipCell)) {
    return { skip: true };
  }

  if (!sku) {
    return { error: { line, message: "Beseka Ref boş" } };
  }

  if (!tipNo) {
    return { error: { line, message: `${sku}: Geçersiz araç Id (${tipCell || "boş"})` } };
  }

  return { row: { line, sku, tipNo } };
}

function parseMatrixRows(matrix: unknown[][]): {
  rows: BulkVehicleCrossRow[];
  errors: BulkVehicleCrossParseError[];
} {
  const rows: BulkVehicleCrossRow[] = [];
  const errors: BulkVehicleCrossParseError[] = [];

  for (let index = 0; index < matrix.length; index++) {
    const line = index + 1;
    const cells = matrix[index] || [];
    const skuCell = String(cells[0] ?? "").trim();
    const tipCell = String(cells[1] ?? "").trim();

    const parsed = parseRowPair(line, skuCell, tipCell);
    if (parsed.skip) continue;
    if (parsed.error) {
      errors.push(parsed.error);
      continue;
    }
    if (parsed.row) rows.push(parsed.row);
  }

  return { rows, errors };
}

export function parseBulkVehicleCrossCsv(csv: string): {
  rows: BulkVehicleCrossRow[];
  errors: BulkVehicleCrossParseError[];
} {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (!lines.length) {
    return { rows: [], errors: [{ line: 1, message: "Dosya boş" }] };
  }

  const delimiter = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
  const matrix = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  return parseMatrixRows(matrix);
}

export function parseBulkVehicleCrossExcel(buffer: ArrayBuffer): {
  rows: BulkVehicleCrossRow[];
  errors: BulkVehicleCrossParseError[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ line: 1, message: "Excel dosyasında sayfa bulunamadı" }] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  return parseMatrixRows(matrix);
}
