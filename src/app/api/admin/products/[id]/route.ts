import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseCodeList, buildOEMEntries } from "@/lib/oem/normalize";
import slugify from "slugify";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const productSchema = z.object({
  sku: z.string().min(1),
  nameTr: z.string().min(1),
  nameEn: z.string().optional(),
  descriptionTr: z.string().optional(),
  categoryId: z.string().min(1),
  images: z.array(z.string()).default([]),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  newUntil: z.string().nullable().optional(),
  oemCodes: z.string().optional(),
  crossCodes: z.string().optional(),
});

function buildSlug(sku: string, name: string) {
  return slugify(`${sku}-${name}`, { lower: true, strict: true });
}

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
  const data = productSchema.parse(body);
  const sku = data.sku.trim().toUpperCase();

  const duplicate = await db.product.findFirst({
    where: { sku, NOT: { id } },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: `Bu SKU başka bir üründe kullanılıyor: ${sku}` },
      { status: 409 },
    );
  }

  const name: Prisma.InputJsonValue = {
    tr: data.nameTr,
    ...(data.nameEn ? { en: data.nameEn } : {}),
  };

  const description: Prisma.InputJsonValue | undefined = data.descriptionTr
    ? { tr: data.descriptionTr }
    : undefined;

  const oemList = parseCodeList(data.oemCodes || "");
  const crossList = parseCodeList(data.crossCodes || "");

  await db.oEMCode.deleteMany({ where: { productId: id } });
  await db.crossCode.deleteMany({ where: { productId: id } });

  const product = await db.product.update({
    where: { id },
    data: {
      sku,
      slug: buildSlug(sku, data.nameTr),
      name,
      description,
      categoryId: data.categoryId,
      images: data.images,
      isNew: data.isNew,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      newUntil: data.newUntil ? new Date(data.newUntil) : null,
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
