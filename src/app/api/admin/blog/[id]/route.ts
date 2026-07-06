import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import slugify from "slugify";

const blogSchema = z.object({
  titleTr: z.string().min(1),
  titleEn: z.string().optional(),
  excerptTr: z.string().optional(),
  contentTr: z.string().min(1),
  coverImage: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data = blogSchema.parse(body);

  const title: Prisma.InputJsonValue = {
    tr: data.titleTr,
    ...(data.titleEn ? { en: data.titleEn } : {}),
  };

  const excerpt: Prisma.InputJsonValue | undefined = data.excerptTr
    ? { tr: data.excerptTr }
    : undefined;

  const content: Prisma.InputJsonValue = { tr: data.contentTr };

  const post = await db.blogPost.update({
    where: { id },
    data: {
      title,
      excerpt,
      content,
      coverImage: data.coverImage || null,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });

  return NextResponse.json(post);
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
  await db.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
