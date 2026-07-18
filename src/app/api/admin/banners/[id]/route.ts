import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bannerSchema = z.object({
  title: z.string().optional(),
  image: z.string().min(1),
  href: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = bannerSchema.parse(body);

    const banner = await db.homeBanner.update({
      where: { id },
      data: {
        title: data.title || null,
        image: data.image,
        href: data.href || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("[admin/banners PUT]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz banner verisi." }, { status: 400 });
    }
    return NextResponse.json({ error: "Banner güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.homeBanner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
