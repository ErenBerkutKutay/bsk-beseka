import { getLocalizedText } from "@/lib/utils";

export type VehicleDisplayRow = {
  key: string;
  tipNo: number;
  make: string;
  model: string;
  makeModel: string;
  yearLabel: string;
};

export function parseProductDescriptionLines(
  content: Record<string, string> | null | undefined,
  locale: string,
): string[] {
  const raw = getLocalizedText(content ?? undefined, locale);
  if (!raw.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function hasManualVehicleDescriptions(
  product: {
    description?: Record<string, string> | null;
    description2?: Record<string, string> | null;
    description3?: Record<string, string> | null;
  },
  locale: string,
): boolean {
  return (
    parseProductDescriptionLines(product.description, locale).length > 0 ||
    parseProductDescriptionLines(product.description2, locale).length > 0 ||
    parseProductDescriptionLines(product.description3, locale).length > 0
  );
}

export function formatYearRange(yearFrom?: number | null, yearTo?: number | null): string {
  if (yearFrom && yearTo) return `${yearFrom} - ${yearTo}`;
  if (yearFrom) return `${yearFrom} -`;
  if (yearTo) return `- ${yearTo}`;
  return "—";
}

export type ProductVehicleDetailRow = {
  key: string;
  make: string;
  model: string;
  yearLabel: string;
};

export function buildProductVehicleDetailRows(product: {
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
}): ProductVehicleDetailRow[] {
  const rows: ProductVehicleDetailRow[] = [];
  const seen = new Set<number>();

  for (const link of product.vehicleTypes ?? []) {
    const vt = link.vehicleType;
    if (!isValidVehicleTipNo(vt.tipNo) || seen.has(vt.tipNo)) continue;

    seen.add(vt.tipNo);
    rows.push({
      key: `v-${vt.tipNo}`,
      make: vt.make || "—",
      model: [vt.modelSeries, vt.typeName].filter(Boolean).join(" / ") || "—",
      yearLabel: formatYearRange(vt.yearFrom, vt.yearTo),
    });
  }

  return rows;
}

export function buildProductVehicleRows(
  product: {
    description?: Record<string, string> | null;
    description2?: Record<string, string> | null;
    description3?: Record<string, string> | null;
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
  },
  locale = "tr",
  options?: { limit?: number; truncateModelChars?: number },
): { rows: ProductVehicleDetailRow[]; total: number; hasMore: boolean } {
  const makeLines = parseProductDescriptionLines(product.description, locale);
  const modelLines = parseProductDescriptionLines(product.description2, locale);
  const yearLines = parseProductDescriptionLines(product.description3, locale);

  if (makeLines.length || modelLines.length || yearLines.length) {
    const lineCount = Math.max(makeLines.length, modelLines.length, yearLines.length);
    const limit = options?.limit ?? lineCount;
    const truncate = options?.truncateModelChars;

    const allRows = Array.from({ length: lineCount }, (_, index) => {
      const model = modelLines[index] || "—";
      return {
        key: `manual-${index}`,
        make: makeLines[index] || "—",
        model: truncate && model !== "—" ? model.slice(0, truncate) : model,
        yearLabel: yearLines[index] || "—",
      };
    });

    return {
      rows: allRows.slice(0, limit),
      total: lineCount,
      hasMore: lineCount > limit,
    };
  }

  const crossRows = buildProductVehicleDetailRows(product);
  const limit = options?.limit ?? crossRows.length;

  return {
    rows: crossRows.slice(0, limit),
    total: crossRows.length,
    hasMore: crossRows.length > limit,
  };
}

export function isValidVehicleTipNo(tipNo?: number | null): tipNo is number {
  return typeof tipNo === "number" && Number.isFinite(tipNo) && tipNo > 0;
}

export function buildVehicleDisplayRows(
  product: {
    description?: Record<string, string> | null;
    description2?: Record<string, string> | null;
    description3?: Record<string, string> | null;
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
  },
  locale = "tr",
): VehicleDisplayRow[] {
  const { rows } = buildProductVehicleRows(product, locale);
  return rows.map((row, index) => ({
    key: row.key,
    tipNo: index,
    make: row.make,
    model: row.model,
    yearLabel: row.yearLabel,
    makeModel: row.make === "—" && row.model === "—" ? "—" : `${row.make} / ${row.model}`,
  }));
}
