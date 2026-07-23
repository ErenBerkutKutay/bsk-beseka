import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  adminPageUpdateSchema,
  buildMetadataJson,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";

const pageSchema = z.object({
  slug: z.string().min(1),
  type: z.enum(["CORPORATE", "PRODUCTION", "RD", "LEGAL", "CONTACT"]),
  title: adminPageUpdateSchema.shape.title,
  content: adminPageUpdateSchema.shape.content,
  metadata: z.record(z.string(), z.unknown()).optional(),
  heroImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const pages = await db.page.findMany({
    where: type ? { type: type as "CORPORATE" | "PRODUCTION" | "RD" | "LEGAL" | "CONTACT" } : undefined,
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });
  return NextResponse.json(pages);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = pageSchema.parse(body);

  const page = await db.page.create({
    data: {
      slug: data.slug,
      type: data.type,
      title: buildRequiredLocalizedJson(data.title),
      content: buildRequiredLocalizedJson(data.content),
      metadata: buildMetadataJson(data.metadata),
      heroImage: data.heroImage || null,
      images: data.images,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(page, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = adminPageUpdateSchema.parse(body);

  const page = await db.page.update({
    where: { id: data.id },
    data: {
      title: buildRequiredLocalizedJson(data.title),
      content: buildRequiredLocalizedJson(data.content),
      metadata: buildMetadataJson(data.metadata),
      heroImage: data.heroImage || null,
      images: data.images ?? [],
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });

  return NextResponse.json(page);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const page = await db.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Sayfa bulunamadı" }, { status: 404 });
  }

  await db.page.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
