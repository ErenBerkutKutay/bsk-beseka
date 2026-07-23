import { z } from "zod";
import { Prisma, type Prisma as PrismaTypes } from "@/generated/prisma/client";
import {
  buildLocalizedJson,
  buildOptionalLocalizedJson,
  localizedDescriptionSchema,
  localizedNameSchema,
} from "@/lib/i18n/localized-content";

export const adminCategorySchema = z.object({
  slug: z.string().min(1),
  name: localizedNameSchema,
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const adminCategoryUpdateSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedNameSchema,
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const adminBlogSchema = z.object({
  title: localizedNameSchema,
  excerpt: localizedDescriptionSchema.optional(),
  content: localizedNameSchema,
  coverImage: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const adminPageUpdateSchema = z.object({
  id: z.string().min(1),
  title: localizedNameSchema,
  content: localizedNameSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  heroImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const adminHomeIntroSchema = z.object({
  eyebrow: localizedNameSchema,
  title: localizedNameSchema,
  body: localizedNameSchema,
  subtitle: localizedNameSchema,
  image: z.string().min(1),
  primaryLabel: localizedNameSchema,
  primaryHref: z.string().min(1),
  secondaryLabel: localizedNameSchema,
  secondaryHref: z.string().min(1),
  isActive: z.boolean().default(true),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
export type AdminBlogInput = z.infer<typeof adminBlogSchema>;
export type AdminPageUpdateInput = z.infer<typeof adminPageUpdateSchema>;

export function buildRequiredLocalizedJson(values: z.infer<typeof localizedNameSchema>) {
  return buildLocalizedJson(values);
}

export function buildOptionalLocalizedField(
  values: z.infer<typeof localizedDescriptionSchema> | undefined,
): PrismaTypes.InputJsonValue | typeof Prisma.DbNull {
  return buildOptionalLocalizedJson(values ?? {}) ?? Prisma.DbNull;
}

export function buildMetadataJson(
  metadata: Record<string, unknown> | undefined,
): PrismaTypes.InputJsonValue | undefined {
  return metadata as PrismaTypes.InputJsonValue | undefined;
}
