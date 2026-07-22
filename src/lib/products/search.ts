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

export async function searchProducts(params: ProductSearchParams) {
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
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 24));
  const skip = (page - 1) * limit;

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

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(isNew ? { isNew: true } : {}),
    ...(sku ? { sku: { contains: sku, mode: "insensitive" } } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(andConditions.length ? { AND: andConditions } : {}),
  };

  if (sku) {
    void trackSearchTerm(sku);
  }

  const codeMatchFilter = q ? buildCodeMatchFilter(q) : undefined;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        oemCodes: codeMatchFilter ? { where: codeMatchFilter, take: 12 } : { take: 12 },
        crossCodes: codeMatchFilter
          ? { where: codeMatchFilter as Prisma.CrossCodeWhereInput, take: 12 }
          : { take: 12 },
        vehicleTypes: {
          where: { vehicleType: { tipNo: { gt: 0 } } },
          take: 8,
          include: {
            vehicleType: {
              select: vehicleTypeSelect,
            },
          },
          orderBy: [{ vehicleType: { make: "asc" } }, { vehicleType: { modelSeries: "asc" } }],
        },
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
