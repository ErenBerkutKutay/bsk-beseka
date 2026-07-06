import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const pageSchema = z.object({
  slug: z.string().min(1),
  type: z.enum(["CORPORATE", "PRODUCTION", "RD", "LEGAL"]),
  titleTr: z.string().min(1),
  contentTr: z.string().min(1),
  heroImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const pages = await db.page.findMany({
    where: type ? { type: type as "CORPORATE" | "PRODUCTION" | "RD" | "LEGAL" } : undefined,
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

  const title: Prisma.InputJsonValue = { tr: data.titleTr };
  const content: Prisma.InputJsonValue = { tr: data.contentTr };

  const page = await db.page.create({
    data: {
      slug: data.slug,
      type: data.type,
      title,
      content,
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
  const { id, titleTr, contentTr, heroImage, images, isActive, sortOrder } = body;

  const page = await db.page.update({
    where: { id },
    data: {
      title: { tr: titleTr },
      content: { tr: contentTr },
      heroImage: heroImage || null,
      images: images ?? [],
      isActive,
      sortOrder,
    },
  });

  return NextResponse.json(page);
}
