import { db } from "@/lib/db";
import { normalizeOEM } from "@/lib/oem/normalize";
import { trackSearchTerm } from "@/lib/analytics";
import { LEGACY_CATEGORY_SLUG_MAP } from "@/lib/categories/product-groups";
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

function buildUnifiedSearchConditions(q: string): Prisma.ProductWhereInput[] {
  return [
    ...buildSkuSearchConditions(q),
    ...buildProductTextSearchConditions(q),
    ...buildCodeRelationFilter(q, "oemCodes"),
    ...buildCodeRelationFilter(q, "crossCodes"),
  ];
}

function buildVehicleFilter(params: {
  make: string;
  model: string;
  engineInfo: string;
  vehicleId?: number;
}): Prisma.ProductWhereInput | undefined {
  const { make, model, engineInfo, vehicleId } = params;
  if (!make && !model && !engineInfo && !vehicleId) return undefined;

  if (vehicleId) {
    return {
      vehicleTypes: {
        some: { tipNo: vehicleId },
      },
    };
  }

  return {
    vehicleTypes: {
      some: {
        vehicleType: {
          tipNo: { gt: 0 },
          ...(make ? { make: { equals: make, mode: "insensitive" } } : {}),
          ...(model ? { modelSeries: { equals: model, mode: "insensitive" } } : {}),
          ...(engineInfo ? { typeName: { equals: engineInfo, mode: "insensitive" } } : {}),
        },
      },
    },
  };
}

export type ProductSearchParams = {
  q?: string;
  sku?: string;
  make?: string;
  model?: string;
  engineInfo?: string;
  subModel?: string;
  vehicleId?: string;
  category?: string;
  isNew?: boolean;
  page?: number;
  limit?: number;
};

const vehicleTypeSelect = {
  tipNo: true,
  make: true,
  modelSeries: true,
  typeName: true,
  yearFrom: true,
  yearTo: true,
  fuelType: true,
  engineVolumeL: true,
  engineVolumeCcm: true,
  kw: true,
  hp: true,
  engineCodes: true,
} as const;

function buildProductSearchWhere(params: ProductSearchParams): Prisma.ProductWhereInput {
  const q = params.q?.trim() || "";
  const sku = params.sku?.trim() || "";
  const make = params.make?.trim() || "";
  const model = params.model?.trim() || "";
  const engineInfo = (params.engineInfo || params.subModel)?.trim() || "";
  const vehicleId = params.vehicleId ? parseInt(params.vehicleId, 10) : undefined;
  const category = params.category?.trim()
    ? LEGACY_CATEGORY_SLUG_MAP[params.category.trim()] || params.category.trim()
    : "";
  const isNew = params.isNew === true;

  const vehicleFilter = buildVehicleFilter({
    make,
    model,
    engineInfo,
    vehicleId: Number.isFinite(vehicleId) ? vehicleId : undefined,
  });

  const andConditions: Prisma.ProductWhereInput[] = [];
  if (vehicleFilter) andConditions.push(vehicleFilter);
  if (q) {
    andConditions.push({ OR: buildUnifiedSearchConditions(q) });
    void trackSearchTerm(q);
  }

  if (sku) {
    void trackSearchTerm(sku);
  }

  return {
    isActive: true,
    ...(isNew ? { isNew: true } : {}),
    ...(sku ? { sku: { contains: sku, mode: "insensitive" } } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(andConditions.length ? { AND: andConditions } : {}),
  };
}

export async function searchProducts(params: ProductSearchParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 24));
  const skip = (page - 1) * limit;
  const where = buildProductSearchWhere(params);

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        oemCodes: { orderBy: { code: "asc" } },
        vehicleTypes: {
          where: { vehicleType: { tipNo: { gt: 0 } } },
          include: {
            vehicleType: {
              select: vehicleTypeSelect,
            },
          },
          orderBy: [{ vehicleType: { make: "asc" } }, { vehicleType: { modelSeries: "asc" } }],
        },
      },
      orderBy: [{ sku: "asc" }],
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return { products, total, page, limit };
}

const EXPORT_LIMIT = 1000;

const exportProductInclude = {
  category: true,
  oemCodes: true,
  vehicleTypes: {
    where: { vehicleType: { tipNo: { gt: 0 } } },
    include: {
      vehicleType: {
        select: vehicleTypeSelect,
      },
    },
    orderBy: [{ vehicleType: { make: "asc" as const } }, { vehicleType: { modelSeries: "asc" as const } }],
  },
};

export async function fetchProductsForExport(
  params: ProductSearchParams,
  includeImages: boolean,
  productIds?: string[],
) {
  if (productIds?.length) {
    const uniqueIds = [...new Set(productIds)];
    const products = await db.product.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
      include: exportProductInclude,
    });

    const byId = new Map(products.map((product) => [product.id, product]));
    const ordered = uniqueIds
      .map((id) => byId.get(id))
      .filter((product): product is (typeof products)[number] => Boolean(product));

    return {
      products: ordered,
      total: ordered.length,
      exported: ordered.length,
      capped: false,
    };
  }

  const limit = EXPORT_LIMIT;
  const where = buildProductSearchWhere(params);

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: exportProductInclude,
      orderBy: { sku: "asc" },
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return { products, total, exported: products.length, capped: total > products.length };
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      oemCodes: true,
      vehicleTypes: {
        where: { vehicleType: { tipNo: { gt: 0 } } },
        include: {
          vehicleType: {
            select: vehicleTypeSelect,
          },
        },
        orderBy: [{ vehicleType: { make: "asc" } }, { vehicleType: { modelSeries: "asc" } }],
      },
    },
  });
}

export async function getRelatedProductsInCategory(
  categoryId: string | null | undefined,
  excludeProductId: string,
  limit = 16,
) {
  if (!categoryId) return [];

  return db.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: excludeProductId },
    },
    select: {
      id: true,
      sku: true,
      slug: true,
      name: true,
      images: true,
    },
    orderBy: { sku: "asc" },
    take: limit,
  });
}
