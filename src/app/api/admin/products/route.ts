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
  weightKg: z.union([z.number(), z.string(), z.null()]).optional(),
  gtip: z.string().optional(),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  newUntil: z.string().nullable().optional(),
  oemCodes: z.string().optional(),
  crossCodes: z.string().optional(),
});

function parseWeightKg(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 1000) / 1000;
}

function parseGtip(value: string | undefined): string | null {
  const normalized = (value || "").replace(/[\s.]/g, "");
  return normalized || null;
}

function buildSlug(sku: string, name: string) {
  return slugify(`${sku}-${name}`, { lower: true, strict: true });
}

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
  const data = productSchema.parse(body);
  const sku = data.sku.trim().toUpperCase();

  const existing = await db.product.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json(
      { error: `Bu Ref zaten kayıtlı: ${sku}. Mevcut ürünü düzenleyin.` },
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

  const product = await db.product.create({
    data: {
      sku,
      slug: buildSlug(sku, data.nameTr),
      name,
      description,
      categoryId: data.categoryId,
      images: data.images,
      weightKg: parseWeightKg(data.weightKg),
      gtip: parseGtip(data.gtip),
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
    include: { category: true, oemCodes: true, crossCodes: true },
  });

  return NextResponse.json(product, { status: 201 });
}
