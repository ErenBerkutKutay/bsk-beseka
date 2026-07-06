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

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const slug = slugify(data.titleTr, { lower: true, strict: true });

  const post = await db.blogPost.create({
    data: {
      slug,
      title,
      excerpt,
      content,
      coverImage: data.coverImage,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
