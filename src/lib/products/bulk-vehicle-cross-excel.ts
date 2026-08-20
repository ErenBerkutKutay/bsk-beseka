import * as XLSX from "xlsx";
import { BULK_VEHICLE_CROSS_CSV_TEMPLATE } from "./bulk-vehicle-cross-parse";

export function createBulkVehicleCrossExcelBuffer(): ArrayBuffer {
  const workbook = XLSX.read(BULK_VEHICLE_CROSS_CSV_TEMPLATE, {
    type: "string",
    FS: ";",
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  sheet["!cols"] = [{ wch: 14 }, { wch: 14 }];

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function excelBufferToVehicleCrossCsv(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excel dosyasında sayfa bulunamadı");
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(sheet, { FS: ";" });
}
