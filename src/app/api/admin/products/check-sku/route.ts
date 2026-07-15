import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sku = request.nextUrl.searchParams.get("sku")?.trim().toUpperCase();
  const excludeId = request.nextUrl.searchParams.get("excludeId") || undefined;

  if (!sku) {
    return NextResponse.json({ error: "SKU gerekli" }, { status: 400 });
  }

  const existing = await db.product.findFirst({
    where: {
      sku,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, sku: true, name: true },
  });

  return NextResponse.json({
    available: !existing,
    existing: existing
      ? {
          id: existing.id,
          sku: existing.sku,
          name: (existing.name as { tr?: string })?.tr || "",
        }
      : null,
  });
}
