import * as XLSX from "xlsx";
import type { Prisma } from "@/generated/prisma/client";

export type ParsedVehicleType = {
  tipNo: number;
  vehicleClass: string | null;
  linkTargetType: string | null;
  make: string;
  modelSeries: string;
  typeName: string;
  modelSeriesNo: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  bodyType: string | null;
  driveType: string | null;
  engineVolumeL: number | null;
  engineVolumeCcm: number | null;
  fuelType: string | null;
  kw: number | null;
  hp: number | null;
  engineCodes: string | null;
  motorNumbers: string | null;
  manufacturerNo: string | null;
  dateGeneral: string | null;
};

function parseIntOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = parseInt(String(value).trim(), 10);
  return Number.isFinite(num) ? num : null;
}

function parseDecimalOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function excelSerialToYear(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number" && value > 1000 && value < 100000) {
    const d = XLSX.SSF.parse_date_code(value);
    return d?.y ?? null;
  }
  const match = String(value).match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

function cleanText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function readTipNo(row: Record<string, unknown>): number | null {
  return parseIntOrNull(row["Id"] ?? row["Tip no."]);
}

function readMake(row: Record<string, unknown>): string | null {
  return cleanText(row["Marka"] ?? row["Üretici"]);
}

function readModel(row: Record<string, unknown>): string | null {
  return cleanText(row["Model"] ?? row["Model Serisi"]);
}

function readTypeName(row: Record<string, unknown>): string | null {
  return cleanText(row["Motor Bilgisi"] ?? row["Tip"]);
}

export function parseVehicleTypeRow(row: Record<string, unknown>): ParsedVehicleType | null {
  const tipNo = readTipNo(row);
  if (!tipNo) return null;

  const make = readMake(row);
  const modelSeries = readModel(row);
  const typeName = readTypeName(row);
  if (!make || !modelSeries || !typeName) return null;

  return {
    tipNo,
    vehicleClass: cleanText(row["Motorlu Taşıt Türü"]),
    linkTargetType: cleanText(row["Bağlantı Hedef Tipi"]),
    make,
    modelSeries,
    typeName,
    modelSeriesNo: cleanText(row["Model Seri No"]),
    yearFrom: excelSerialToYear(row["Başlangıç Tarihi"] ?? row["Model Yışı Başlangıcı"]),
    yearTo: excelSerialToYear(row["Bitiş Tarihi"] ?? row["Model Yılı Bitişi"]),
    bodyType: cleanText(row["Gövde Tipi"]),
    driveType: cleanText(row["Tahrik Tipi"]),
    engineVolumeL: parseDecimalOrNull(row["Motor Hacmi(l)"]),
    engineVolumeCcm: parseIntOrNull(row["Motor Hacmi(ccm tekn.)"]),
    fuelType: cleanText(row["Yakıt Tipi"]),
    kw: parseIntOrNull(row["kW"]),
    hp: parseIntOrNull(row["HP"]),
    engineCodes: cleanText(row["Motor Kodları"]),
    motorNumbers: cleanText(row["Motor Numaraları"]),
    manufacturerNo: cleanText(row["Üretici No"]),
    dateGeneral: cleanText(row["Date General"]),
  };
}

export function parseVehicleTypesFromExcelBuffer(buffer: ArrayBuffer): ParsedVehicleType[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: "" },
  );

  const parsed: ParsedVehicleType[] = [];
  const seen = new Set<number>();

  for (const row of rows) {
    const item = parseVehicleTypeRow(row);
    if (!item || seen.has(item.tipNo)) continue;
    seen.add(item.tipNo);
    parsed.push(item);
  }

  return parsed;
}

export function toVehicleTypeCreateInput(
  item: ParsedVehicleType,
): Prisma.VehicleTypeCreateInput {
  return {
    tipNo: item.tipNo,
    vehicleClass: item.vehicleClass,
    linkTargetType: item.linkTargetType,
    make: item.make,
    modelSeries: item.modelSeries,
    typeName: item.typeName,
    modelSeriesNo: item.modelSeriesNo,
    yearFrom: item.yearFrom,
    yearTo: item.yearTo,
    bodyType: item.bodyType,
    driveType: item.driveType,
    engineVolumeL: item.engineVolumeL,
    engineVolumeCcm: item.engineVolumeCcm,
    fuelType: item.fuelType,
    kw: item.kw,
    hp: item.hp,
    engineCodes: item.engineCodes,
    motorNumbers: item.motorNumbers,
    manufacturerNo: item.manufacturerNo,
    dateGeneral: item.dateGeneral,
  };
}
