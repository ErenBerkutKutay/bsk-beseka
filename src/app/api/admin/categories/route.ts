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

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const category = await db.category.findUnique({ where: { id } });

  if (!category) {
    return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });
  }

  await db.$transaction([
    db.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
    db.category.updateMany({ where: { parentId: id }, data: { parentId: null } }),
    db.category.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
