import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const make = searchParams.get("make")?.trim();
  const model = searchParams.get("model")?.trim();

  if (!make) {
    const rows = await db.vehicleType.groupBy({
      by: ["make"],
      orderBy: { make: "asc" },
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: row.make,
        name: row.make,
      })),
    );
  }

  if (!model) {
    const rows = await db.vehicleType.groupBy({
      by: ["modelSeries"],
      where: {
        make: { equals: make, mode: "insensitive" },
      },
      orderBy: { modelSeries: "asc" },
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: row.modelSeries,
        name: row.modelSeries,
      })),
    );
  }

  const rows = await db.vehicleType.findMany({
    where: {
      make: { equals: make, mode: "insensitive" },
      modelSeries: { equals: model, mode: "insensitive" },
    },
    select: {
      tipNo: true,
      typeName: true,
      yearFrom: true,
      yearTo: true,
      fuelType: true,
      engineVolumeL: true,
      kw: true,
      hp: true,
    },
    orderBy: [{ typeName: "asc" }, { yearFrom: "asc" }],
    take: 5000,
  });

  return NextResponse.json(
    rows.map((row) => ({
      id: String(row.tipNo),
      name: row.typeName,
      tipNo: row.tipNo,
      yearFrom: row.yearFrom,
      yearTo: row.yearTo,
      fuelType: row.fuelType,
      engineVolumeL: row.engineVolumeL ? Number(row.engineVolumeL) : null,
      kw: row.kw,
      hp: row.hp,
    })),
  );
}
