import * as XLSX from "xlsx";
import { BULK_PRODUCT_CSV_TEMPLATE } from "./bulk-import-parse";

export function createBulkProductExcelBuffer(): ArrayBuffer {
  const workbook = XLSX.read(BULK_PRODUCT_CSV_TEMPLATE, {
    type: "string",
    FS: ";",
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  sheet["!cols"] = [
    { wch: 12 },
    { wch: 42 },
    { wch: 28 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 20 },
    { wch: 8 },
    { wch: 8 },
  ];

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function excelBufferToCsv(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excel dosyasında sayfa bulunamadı");
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(sheet, { FS: ";" });
}
