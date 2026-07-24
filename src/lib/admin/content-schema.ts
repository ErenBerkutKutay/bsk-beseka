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

export const adminHomeContactSchema = z.object({
  eyebrow: localizedNameSchema,
  title: localizedNameSchema,
  companyName: localizedNameSchema,
  address: localizedNameSchema,
  phone: z.string().min(1),
  email: z.string().email(),
  image: z.string().min(1),
  buttonLabel: localizedNameSchema,
  buttonHref: z.string().min(1),
  textPanelEnabled: z.boolean().default(true),
  textPanelColor: z.string().min(1),
  textPanelOpacity: z.number().min(0).max(100).default(75),
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

export const adminDownloadAssetSchema = z.object({
  title: localizedNameSchema,
  coverImage: z.string().optional(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().default(0),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const adminDownloadAssetUpdateSchema = adminDownloadAssetSchema.extend({
  id: z.string().min(1),
});

export function buildMetadataJson(
  metadata: Record<string, unknown> | undefined,
): PrismaTypes.InputJsonValue | undefined {
  return metadata as PrismaTypes.InputJsonValue | undefined;
}
