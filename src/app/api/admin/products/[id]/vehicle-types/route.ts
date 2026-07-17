import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { importVehicleTypesFromBuffer } from "@/lib/vehicles/import-vehicle-types";
import { z } from "zod";

const bulkSchema = z.object({
  tipNos: z.array(z.number().int().positive()).min(1),
  replace: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const links = await db.productVehicleType.findMany({
    where: { productId: id },
    include: {
      vehicleType: {
        select: {
          tipNo: true,
          make: true,
          modelSeries: true,
          typeName: true,
          yearFrom: true,
          yearTo: true,
          fuelType: true,
        },
      },
    },
    orderBy: [{ vehicleType: { make: "asc" } }, { vehicleType: { modelSeries: "asc" } }],
  });

  return NextResponse.json(links);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;
  const body = await request.json();

  if (body.bulk) {
    const raw = String(body.bulk)
      .split(/[\n,;]+/)
      .map((part: string) => part.trim())
      .filter(Boolean);

    const tipNos = [...new Set(raw.map((part) => parseInt(part, 10)).filter((n) => Number.isFinite(n)))];
    if (!tipNos.length) {
      return NextResponse.json({ error: "Geçerli tip no bulunamadı" }, { status: 400 });
    }

    const existingTypes = await db.vehicleType.findMany({
      where: { tipNo: { in: tipNos } },
      select: { tipNo: true },
    });
    const validTipNos = existingTypes.map((t) => t.tipNo);
    const missing = tipNos.filter((tip) => !validTipNos.includes(tip));

    if (body.replace === true) {
      await db.productVehicleType.deleteMany({ where: { productId } });
    }

    if (validTipNos.length) {
      await db.productVehicleType.createMany({
        data: validTipNos.map((tipNo) => ({ productId, tipNo })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      linked: validTipNos.length,
      missing,
      total: tipNos.length,
    });
  }

  const data = bulkSchema.parse(body);

  if (data.replace) {
    await db.productVehicleType.deleteMany({ where: { productId } });
  }

  const existingTypes = await db.vehicleType.findMany({
    where: { tipNo: { in: data.tipNos } },
    select: { tipNo: true },
  });
  const validTipNos = existingTypes.map((t) => t.tipNo);

  if (validTipNos.length) {
    await db.productVehicleType.createMany({
      data: validTipNos.map((tipNo) => ({ productId, tipNo })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    linked: validTipNos.length,
    missing: data.tipNos.filter((tip) => !validTipNos.includes(tip)),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;
  const tipNo = parseInt(request.nextUrl.searchParams.get("tipNo") || "", 10);

  if (!Number.isFinite(tipNo)) {
    return NextResponse.json({ error: "tipNo required" }, { status: 400 });
  }

  await db.productVehicleType.deleteMany({
    where: { productId, tipNo },
  });

  return NextResponse.json({ success: true });
}
