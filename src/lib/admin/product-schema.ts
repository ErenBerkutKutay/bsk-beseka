import slugify from "slugify";
import { z } from "zod";
import { Prisma, type Prisma as PrismaTypes } from "@/generated/prisma/client";
import {
  buildLocalizedJson,
  buildOptionalLocalizedJson,
  localizedDescriptionSchema,
  localizedNameSchema,
} from "@/lib/i18n/localized-content";

export const adminProductSchema = z.object({
  sku: z.string().min(1),
  name: localizedNameSchema,
  description: localizedDescriptionSchema.optional(),
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

export type AdminProductInput = z.infer<typeof adminProductSchema>;

export function parseWeightKg(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 1000) / 1000;
}

export function parseGtip(value: string | undefined): string | null {
  const normalized = (value || "").replace(/[\s.]/g, "");
  return normalized || null;
}

export function buildProductSlug(sku: string, nameTr: string) {
  return slugify(`${sku}-${nameTr}`, { lower: true, strict: true });
}

export function buildProductLocalizedFields(data: AdminProductInput) {
  const name = buildLocalizedJson(data.name);
  return { name, nameTr: data.name.tr.trim() };
}

export function productWriteData(
  data: AdminProductInput,
  sku: string,
): {
  sku: string;
  slug: string;
  name: Prisma.InputJsonValue;
  description: PrismaTypes.InputJsonValue | typeof Prisma.DbNull;
  categoryId: string;
  images: string[];
  weightKg: number | null;
  gtip: string | null;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  newUntil: Date | null;
} {
  const { name, nameTr } = buildProductLocalizedFields(data);

  return {
    sku,
    slug: buildProductSlug(sku, nameTr),
    name,
    description: buildOptionalLocalizedJson(data.description ?? {}) ?? Prisma.DbNull,
    categoryId: data.categoryId,
    images: data.images,
    weightKg: parseWeightKg(data.weightKg),
    gtip: parseGtip(data.gtip),
    isNew: data.isNew,
    isFeatured: data.isFeatured,
    isActive: data.isActive,
    newUntil: data.newUntil ? new Date(data.newUntil) : null,
  };
}
