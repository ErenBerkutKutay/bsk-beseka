import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeOEM } from "@/lib/oem/normalize";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() || "";
  const sku = searchParams.get("sku")?.trim() || "";
  const make = searchParams.get("make")?.trim() || "";
  const model = searchParams.get("model")?.trim() || "";
  const subModel = searchParams.get("subModel")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const isNew = searchParams.get("isNew") === "true";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 24)));
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(isNew ? { isNew: true } : {}),
    ...(sku
      ? { sku: { contains: sku, mode: "insensitive" } }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(make || model || subModel
      ? {
          fitments: {
            some: {
              ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
              ...(model ? { model: { equals: model, mode: "insensitive" } } : {}),
              ...(subModel
                ? { subModel: { equals: subModel, mode: "insensitive" } }
                : {}),
            },
          },
        }
      : {}),
  };

  if (q) {
    const normalized = normalizeOEM(q);
    where.OR = [
      { sku: { contains: q, mode: "insensitive" } },
      { oemCodes: { some: { codeNormalized: normalized } } },
      { oemCodes: { some: { codeNormalized: { startsWith: normalized } } } },
      { crossCodes: { some: { codeNormalized: normalized } } },
      { crossCodes: { some: { codeNormalized: { startsWith: normalized } } } },
    ];

    if (normalized.length >= 3) {
      where.OR.push(
        {
          oemCodes: {
            some: {
              codeNormalized: { contains: normalized },
            },
          },
        },
        {
          crossCodes: {
            some: {
              codeNormalized: { contains: normalized },
            },
          },
        },
      );
    }
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        oemCodes: q
          ? {
              where: {
                OR: [
                  { codeNormalized: normalizeOEM(q) },
                  { codeNormalized: { startsWith: normalizeOEM(q) } },
                ],
              },
              take: 3,
            }
          : { take: 3 },
        crossCodes: q
          ? {
              where: {
                OR: [
                  { codeNormalized: normalizeOEM(q) },
                  { codeNormalized: { startsWith: normalizeOEM(q) } },
                ],
              },
              take: 3,
            }
          : { take: 3 },
      },
      orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
