import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseCodeList, buildOEMEntries } from "@/lib/oem/normalize";
import { adminProductSchema, productWriteData } from "@/lib/admin/product-schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    include: {
      category: true,
      _count: { select: { oemCodes: true, crossCodes: true, fitments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = adminProductSchema.parse(body);
  const sku = data.sku.trim().toUpperCase();

  const existing = await db.product.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json(
      { error: `Bu Ref zaten kayıtlı: ${sku}. Mevcut ürünü düzenleyin.` },
      { status: 409 },
    );
  }

  const oemList = parseCodeList(data.oemCodes || "");
  const crossList = parseCodeList(data.crossCodes || "");

  const product = await db.product.create({
    data: {
      ...productWriteData(data, sku),
      oemCodes: {
        create: buildOEMEntries(oemList),
      },
      crossCodes: {
        create: buildOEMEntries(crossList).map((entry) => ({
          ...entry,
          brand: null,
        })),
      },
    },
    include: { category: true, oemCodes: true, crossCodes: true },
  });

  return NextResponse.json(product, { status: 201 });
}
