import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  adminHomeIntroSchema,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";
import { fallbackHomeIntro } from "@/lib/beseka/home-intro";
import { getAdminHomeIntro } from "@/lib/home-intro";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const intro = await getAdminHomeIntro();
  return NextResponse.json(intro);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = adminHomeIntroSchema.parse(body);

  const payload = {
    eyebrow: buildRequiredLocalizedJson(data.eyebrow),
    title: buildRequiredLocalizedJson(data.title),
    body: buildRequiredLocalizedJson(data.body),
    subtitle: buildRequiredLocalizedJson(data.subtitle),
    image: data.image,
    primaryLabel: buildRequiredLocalizedJson(data.primaryLabel),
    primaryHref: data.primaryHref.trim(),
    secondaryLabel: buildRequiredLocalizedJson(data.secondaryLabel),
    secondaryHref: data.secondaryHref.trim(),
    isActive: data.isActive,
  };

  const intro = await db.homeIntro.upsert({
    where: { slug: "default" },
    update: payload,
    create: {
      slug: "default",
      ...payload,
    },
  });

  return NextResponse.json({
    id: intro.id,
    eyebrow: data.eyebrow,
    title: data.title,
    body: data.body,
    subtitle: data.subtitle,
    image: intro.image,
    primaryLabel: data.primaryLabel,
    primaryHref: intro.primaryHref,
    secondaryLabel: data.secondaryLabel,
    secondaryHref: intro.secondaryHref,
    isActive: intro.isActive,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fallback = fallbackHomeIntro;
  const intro = await db.homeIntro.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      slug: "default",
      eyebrow: fallback.eyebrow,
      title: fallback.title,
      body: fallback.body,
      subtitle: fallback.subtitle,
      image: fallback.image,
      primaryLabel: fallback.primaryLabel,
      primaryHref: fallback.primaryHref,
      secondaryLabel: fallback.secondaryLabel,
      secondaryHref: fallback.secondaryHref,
      isActive: fallback.isActive,
    },
  });

  return NextResponse.json(intro, { status: 201 });
}
