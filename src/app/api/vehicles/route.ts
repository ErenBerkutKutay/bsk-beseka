import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function binekFilter(includeAll: boolean) {
  if (includeAll) return {};
  return { linkTargetType: { in: ["Otomobil", "E-Otomobil"] } };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const make = searchParams.get("make")?.trim();
  const model = searchParams.get("model")?.trim();
  const includeAll = searchParams.get("all") === "true";
  const filter = binekFilter(includeAll);

  if (!make) {
    const rows = await db.vehicleType.groupBy({
      by: ["make"],
      where: filter,
      orderBy: { make: "asc" },
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: row.make,
        name: row.make,
        models: [],
      })),
    );
  }

  if (!model) {
    const rows = await db.vehicleType.groupBy({
      by: ["modelSeries"],
      where: {
        ...filter,
        make: { equals: make, mode: "insensitive" },
      },
      orderBy: { modelSeries: "asc" },
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: row.modelSeries,
        name: row.modelSeries,
        subModels: [],
      })),
    );
  }

  const rows = await db.vehicleType.findMany({
    where: {
      ...filter,
      make: { equals: make, mode: "insensitive" },
      modelSeries: { equals: model, mode: "insensitive" },
    },
    select: {
      tipNo: true,
      typeName: true,
      yearFrom: true,
      yearTo: true,
      fuelType: true,
    },
    orderBy: [{ typeName: "asc" }, { yearFrom: "asc" }],
    take: 2000,
  });

  const seen = new Map<string, { id: string; name: string; tipNo: number }>();
  for (const row of rows) {
    if (!seen.has(row.typeName)) {
      seen.set(row.typeName, {
        id: row.typeName,
        name: row.typeName,
        tipNo: row.tipNo,
      });
    }
  }

  return NextResponse.json(Array.from(seen.values()));
}
