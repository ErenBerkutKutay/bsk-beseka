import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const fitmentSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  subModel: z.string().optional(),
  yearFrom: z.number().nullable().optional(),
  yearTo: z.number().nullable().optional(),
  engine: z.string().optional(),
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
  const fitments = await db.vehicleFitment.findMany({
    where: { productId: id },
    orderBy: [{ make: "asc" }, { model: "asc" }],
  });

  return NextResponse.json(fitments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.bulk) {
    const rows = String(body.bulk)
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean);

    const fitments = rows.map((line: string) => {
      const [make, model, subModel, yearFrom, yearTo, engine] = line
        .split(";")
        .map((part) => part.trim());
      return {
        productId: id,
        make,
        model,
        subModel: subModel || null,
        yearFrom: yearFrom ? Number(yearFrom) : null,
        yearTo: yearTo ? Number(yearTo) : null,
        engine: engine || null,
      };
    });

    const result = await db.vehicleFitment.createMany({ data: fitments });

    await db.fitmentImportLog.create({
      data: {
        fileName: "manual-bulk",
        rowCount: rows.length,
        successCount: result.count,
        errorCount: rows.length - result.count,
        importedBy: session.user.email,
      },
    });

    return NextResponse.json({ count: result.count });
  }

  const data = fitmentSchema.parse(body);
  const fitment = await db.vehicleFitment.create({
    data: { productId: id, ...data },
  });

  return NextResponse.json(fitment, { status: 201 });
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
  const fitmentId = request.nextUrl.searchParams.get("fitmentId");

  if (!fitmentId) {
    return NextResponse.json({ error: "fitmentId required" }, { status: 400 });
  }

  await db.vehicleFitment.delete({
    where: { id: fitmentId },
  });

  return NextResponse.json({ success: true });
}
