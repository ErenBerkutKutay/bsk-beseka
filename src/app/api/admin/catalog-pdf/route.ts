import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adminCatalogPdfSettingsSchema } from "@/lib/admin/content-schema";
import { getCatalogPdfSettings } from "@/lib/catalog/pdf-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getCatalogPdfSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = adminCatalogPdfSettingsSchema.parse(body);

  const settings = await db.catalogPdfSettings.upsert({
    where: { slug: "default" },
    update: {
      logoUrl: data.logoUrl,
      headerBackgroundUrl: data.headerBackgroundUrl || null,
      headerBackgroundColor: data.headerBackgroundColor,
      headerHeightMm: data.headerHeightMm,
      documentTitle: data.documentTitle,
      tableHeaderColor: data.tableHeaderColor,
      isActive: data.isActive,
    },
    create: {
      slug: "default",
      logoUrl: data.logoUrl,
      headerBackgroundUrl: data.headerBackgroundUrl || null,
      headerBackgroundColor: data.headerBackgroundColor,
      headerHeightMm: data.headerHeightMm,
      documentTitle: data.documentTitle,
      tableHeaderColor: data.tableHeaderColor,
      isActive: data.isActive,
    },
  });

  return NextResponse.json({
    id: settings.id,
    logoUrl: settings.logoUrl,
    headerBackgroundUrl: settings.headerBackgroundUrl,
    headerBackgroundColor: settings.headerBackgroundColor,
    headerHeightMm: settings.headerHeightMm,
    documentTitle: settings.documentTitle,
    tableHeaderColor: settings.tableHeaderColor,
    isActive: settings.isActive,
  });
}
