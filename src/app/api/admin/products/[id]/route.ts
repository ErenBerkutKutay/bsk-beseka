import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseCodeList, buildOEMEntries } from "@/lib/oem/normalize";
import { adminProductSchema, productWriteData } from "@/lib/admin/product-schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      oemCodes: true,
      crossCodes: true,
      fitments: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data = adminProductSchema.parse(body);
  const sku = data.sku.trim().toUpperCase();

  const duplicate = await db.product.findFirst({
    where: { sku, NOT: { id } },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: `Bu Ref başka bir üründe kullanılıyor: ${sku}` },
      { status: 409 },
    );
  }

  const oemList = parseCodeList(data.oemCodes || "");
  const crossList = parseCodeList(data.crossCodes || "");

  await db.oEMCode.deleteMany({ where: { productId: id } });
  await db.crossCode.deleteMany({ where: { productId: id } });

  const product = await db.product.update({
    where: { id },
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
    include: { category: true, oemCodes: true, crossCodes: true, fitments: true },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
