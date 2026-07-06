import { db } from "@/lib/db";
import { normalizeOEM } from "@/lib/oem/normalize";
import type { Prisma } from "@/generated/prisma/client";

export type ProductSearchParams = {
  q?: string;
  sku?: string;
  make?: string;
  model?: string;
  subModel?: string;
  category?: string;
  isNew?: boolean;
  page?: number;
  limit?: number;
};

export async function searchProducts(params: ProductSearchParams) {
  const q = params.q?.trim() || "";
  const sku = params.sku?.trim() || "";
  const make = params.make?.trim() || "";
  const model = params.model?.trim() || "";
  const subModel = params.subModel?.trim() || "";
  const category = params.category?.trim() || "";
  const isNew = params.isNew === true;
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 24));
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(isNew ? { isNew: true } : {}),
    ...(sku ? { sku: { contains: sku, mode: "insensitive" } } : {}),
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
            some: { codeNormalized: { contains: normalized } },
          },
        },
        {
          crossCodes: {
            some: { codeNormalized: { contains: normalized } },
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

  return { products, total, page, limit };
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      oemCodes: true,
      crossCodes: true,
      fitments: { orderBy: [{ make: "asc" }, { model: "asc" }] },
    },
  });
}
