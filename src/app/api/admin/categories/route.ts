import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const categorySchema = z.object({
  slug: z.string().min(1),
  nameTr: z.string().min(1),
  nameEn: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const categories = await db.category.findMany({
    include: { children: true, parent: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = categorySchema.parse(body);

  const name: Prisma.InputJsonValue = {
    tr: data.nameTr,
    ...(data.nameEn ? { en: data.nameEn } : {}),
  };

  const category = await db.category.create({
    data: {
      slug: data.slug,
      name,
      image: data.image || null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(category, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, slug, nameTr, image, isActive } = body;

  const category = await db.category.update({
    where: { id },
    data: {
      ...(slug ? { slug } : {}),
      ...(nameTr ? { name: { tr: nameTr } } : {}),
      image: image ?? null,
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    },
  });

  return NextResponse.json(category);
}
