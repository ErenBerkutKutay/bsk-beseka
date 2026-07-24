import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  adminHomeContactSchema,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";
import { getAdminHomeContact } from "@/lib/home-contact";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contact = await getAdminHomeContact();
  return NextResponse.json(contact);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = adminHomeContactSchema.parse(body);

  const payload = {
    eyebrow: buildRequiredLocalizedJson(data.eyebrow),
    title: buildRequiredLocalizedJson(data.title),
    companyName: buildRequiredLocalizedJson(data.companyName),
    address: buildRequiredLocalizedJson(data.address),
    phone: data.phone.trim(),
    email: data.email.trim(),
    image: data.image,
    buttonLabel: buildRequiredLocalizedJson(data.buttonLabel),
    buttonHref: data.buttonHref.trim(),
    textPanelEnabled: data.textPanelEnabled,
    textPanelColor: data.textPanelColor.trim(),
    textPanelOpacity: data.textPanelOpacity,
    isActive: data.isActive,
  };

  const contact = await db.homeContact.upsert({
    where: { slug: "default" },
    update: payload,
    create: {
      slug: "default",
      ...payload,
    },
  });

  return NextResponse.json({
    id: contact.id,
    eyebrow: data.eyebrow,
    title: data.title,
    companyName: data.companyName,
    address: data.address,
    phone: contact.phone,
    email: contact.email,
    image: contact.image,
    buttonLabel: data.buttonLabel,
    buttonHref: contact.buttonHref,
    textPanelEnabled: contact.textPanelEnabled,
    textPanelColor: contact.textPanelColor,
    textPanelOpacity: contact.textPanelOpacity,
    isActive: contact.isActive,
  });
}
