import { db } from "@/lib/db";
import { normalizeOEM } from "@/lib/oem/normalize";
import { trackSearchTerm } from "@/lib/analytics";
import type { Prisma } from "@/generated/prisma/client";

const PRODUCT_TEXT_LOCALES = ["tr", "en", "de", "ar", "es", "it"] as const;

function buildProductTextSearchConditions(q: string): Prisma.ProductWhereInput[] {
  return PRODUCT_TEXT_LOCALES.flatMap((locale) => [
    { name: { path: [locale], string_contains: q, mode: "insensitive" as const } },
    {
      description: { path: [locale], string_contains: q, mode: "insensitive" as const },
    },
  ]);
}

function buildSkuSearchConditions(q: string): Prisma.ProductWhereInput[] {
  const conditions: Prisma.ProductWhereInput[] = [
    { sku: { contains: q, mode: "insensitive" } },
    { sku: { equals: q, mode: "insensitive" } },
  ];

  const compact = q.replace(/\s+/g, "");
  if (compact && compact !== q) {
    conditions.push({ sku: { contains: compact, mode: "insensitive" } });
  }

  return conditions;
}

function buildCodeRelationFilter(
  q: string,
  relation: "oemCodes" | "crossCodes",
): Prisma.ProductWhereInput[] {
  const normalized = normalizeOEM(q);
  if (!normalized) return [];

  const conditions: Prisma.ProductWhereInput[] = [
    { [relation]: { some: { code: { contains: q, mode: "insensitive" } } } },
    { [relation]: { some: { codeNormalized: normalized } } },
    { [relation]: { some: { codeNormalized: { startsWith: normalized } } } },
  ];

  if (normalized.length >= 2) {
    conditions.push({
      [relation]: { some: { codeNormalized: { contains: normalized } } },
    });
  }

  const compact = q.replace(/[\s.\-/_]/g, "");
  if (compact && compact !== q) {
    conditions.push({
      [relation]: { some: { code: { contains: compact, mode: "insensitive" } } },
    });
  }

  return conditions;
}

function buildCodeMatchFilter(q: string): Prisma.OEMCodeWhereInput {
  const normalized = normalizeOEM(q);
  const or: Prisma.OEMCodeWhereInput[] = [
    { code: { contains: q, mode: "insensitive" } },
  ];

  if (normalized) {
    or.push(
      { codeNormalized: normalized },
      { codeNormalized: { startsWith: normalized } },
    );
    if (normalized.length >= 2) {
      or.push({ codeNormalized: { contains: normalized } });
    }
  }

  return { OR: or };
}

function buildUnifiedSearchConditions(q: string): Prisma.ProductWhereInput[] {
  return [
    ...buildSkuSearchConditions(q),
    ...buildProductTextSearchConditions(q),
    ...buildCodeRelationFilter(q, "oemCodes"),
    ...buildCodeRelationFilter(q, "crossCodes"),
  ];
}

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
          OR: [
            {
              vehicleTypes: {
                some: {
                  vehicleType: {
                    ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
                    ...(model
                      ? { modelSeries: { equals: model, mode: "insensitive" } }
                      : {}),
                    ...(subModel
                      ? { typeName: { equals: subModel, mode: "insensitive" } }
                      : {}),
                  },
                },
              },
            },
            {
              fitments: {
                some: {
                  ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
                  ...(model ? { model: { equals: model, mode: "insensitive" } } : {}),
                  ...(subModel
                    ? { subModel: { equals: subModel, mode: "insensitive" } }
                    : {}),
                },
              },
            },
          ],
        }
      : {}),
  };

  if (q) {
    where.OR = buildUnifiedSearchConditions(q);
    void trackSearchTerm(q);
  }

  if (sku) {
    void trackSearchTerm(sku);
  }

  const codeMatchFilter = q ? buildCodeMatchFilter(q) : undefined;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        oemCodes: codeMatchFilter ? { where: codeMatchFilter, take: 3 } : { take: 3 },
        crossCodes: codeMatchFilter
          ? { where: codeMatchFilter as Prisma.CrossCodeWhereInput, take: 3 }
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
      vehicleTypes: {
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
              engineCodes: true,
            },
          },
        },
        orderBy: [{ vehicleType: { make: "asc" } }, { vehicleType: { modelSeries: "asc" } }],
      },
    },
  });
}
