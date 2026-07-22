import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const syncSchema = z.object({
  tipNos: z.array(z.number().int().positive()),
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
    where: { productId: id, tipNo: { gt: 0 } },
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

  if (Array.isArray(body.tipNos)) {
    const data = syncSchema.parse(body);
    const tipNos = [...new Set(data.tipNos)];

    if (data.replace) {
      await db.productVehicleType.deleteMany({ where: { productId } });
    }

    if (!tipNos.length) {
      return NextResponse.json({ linked: 0, missing: [], total: 0 });
    }

    const existingTypes = await db.vehicleType.findMany({
      where: { tipNo: { in: tipNos } },
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
      missing: tipNos.filter((tip) => !validTipNos.includes(tip)),
      total: tipNos.length,
    });
  }

  if (body.bulk) {
    const raw = String(body.bulk)
      .split(/[\n,;]+/)
      .map((part: string) => part.trim())
      .filter(Boolean);

    const tipNos = [...new Set(raw.map((part) => parseInt(part, 10)).filter((n) => Number.isFinite(n) && n > 0))];
    if (!tipNos.length) {
      return NextResponse.json({ error: "Geçerli Id bulunamadı" }, { status: 400 });
    }

    if (body.replace === true) {
      await db.productVehicleType.deleteMany({ where: { productId } });
    }

    const existingTypes = await db.vehicleType.findMany({
      where: { tipNo: { in: tipNos } },
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
      missing: tipNos.filter((tip) => !validTipNos.includes(tip)),
      total: tipNos.length,
    });
  }

  return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
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
