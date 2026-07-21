export type VehicleDisplayRow = {
  key: string;
  makeModel: string;
  yearLabel: string;
};

export function formatYearRange(yearFrom?: number | null, yearTo?: number | null): string {
  if (yearFrom && yearTo) return `${yearFrom} - ${yearTo}`;
  if (yearFrom) return `${yearFrom} -`;
  if (yearTo) return `- ${yearTo}`;
  return "—";
}

export function buildVehicleDisplayRows(product: {
  fitments?: {
    id: string;
    make: string;
    model: string;
    subModel?: string | null;
    yearFrom?: number | null;
    yearTo?: number | null;
  }[];
  vehicleTypes?: {
    vehicleType: {
      make: string;
      modelSeries: string;
      typeName: string;
      yearFrom?: number | null;
      yearTo?: number | null;
    };
  }[];
}): VehicleDisplayRow[] {
  const rows: VehicleDisplayRow[] = [];
  const seen = new Set<string>();

  for (const fitment of product.fitments ?? []) {
    const makeModel = [fitment.make, fitment.model, fitment.subModel].filter(Boolean).join(" / ");
    const key = `f-${fitment.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({
        key,
        makeModel,
        yearLabel: formatYearRange(fitment.yearFrom, fitment.yearTo),
      });
    }
  }

  for (const link of product.vehicleTypes ?? []) {
    const vt = link.vehicleType;
    const makeModel = [vt.make, vt.modelSeries, vt.typeName].filter(Boolean).join(" / ");
    const key = `v-${makeModel}-${vt.yearFrom ?? ""}-${vt.yearTo ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({
        key,
        makeModel,
        yearLabel: formatYearRange(vt.yearFrom, vt.yearTo),
      });
    }
  }

  return rows;
}
