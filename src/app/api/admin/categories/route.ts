import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  adminCategorySchema,
  adminCategoryUpdateSchema,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";

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
  const data = adminCategorySchema.parse(body);

  const category = await db.category.create({
    data: {
      slug: data.slug,
      name: buildRequiredLocalizedJson(data.name),
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
  const data = adminCategoryUpdateSchema.parse(body);

  const category = await db.category.update({
    where: { id: data.id },
    data: {
      slug: data.slug,
      name: buildRequiredLocalizedJson(data.name),
      image: data.image ?? null,
      ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
    },
  });

  return NextResponse.json(category);
}
