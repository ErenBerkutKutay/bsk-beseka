export type VehicleDisplayRow = {
  key: string;
  tipNo: number;
  makeModel: string;
  yearLabel: string;
};

export function formatYearRange(yearFrom?: number | null, yearTo?: number | null): string {
  if (yearFrom && yearTo) return `${yearFrom} - ${yearTo}`;
  if (yearFrom) return `${yearFrom} -`;
  if (yearTo) return `- ${yearTo}`;
  return "—";
}

export function isValidVehicleTipNo(tipNo?: number | null): tipNo is number {
  return typeof tipNo === "number" && Number.isFinite(tipNo) && tipNo > 0;
}

export function buildVehicleDisplayRows(product: {
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
}): VehicleDisplayRow[] {
  const rows: VehicleDisplayRow[] = [];
  const seen = new Set<number>();

  for (const link of product.vehicleTypes ?? []) {
    const vt = link.vehicleType;
    if (!isValidVehicleTipNo(vt.tipNo) || seen.has(vt.tipNo)) continue;

    seen.add(vt.tipNo);
    rows.push({
      key: `v-${vt.tipNo}`,
      tipNo: vt.tipNo,
      makeModel: [vt.make, vt.modelSeries, vt.typeName].filter(Boolean).join(" / "),
      yearLabel: formatYearRange(vt.yearFrom, vt.yearTo),
    });
  }

  return rows;
}
