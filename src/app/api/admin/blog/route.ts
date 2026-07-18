import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import slugify from "slugify";
import {
  adminBlogSchema,
  buildOptionalLocalizedField,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";

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
  const data = adminBlogSchema.parse(body);
  const slug = slugify(data.title.tr, { lower: true, strict: true });

  const post = await db.blogPost.create({
    data: {
      slug,
      title: buildRequiredLocalizedJson(data.title),
      excerpt: buildOptionalLocalizedField(data.excerpt),
      content: buildRequiredLocalizedJson(data.content),
      coverImage: data.coverImage || null,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
