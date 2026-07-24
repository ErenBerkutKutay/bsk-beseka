import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  adminDownloadAssetUpdateSchema,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = adminDownloadAssetUpdateSchema.parse({ ...(await request.json()), id });

  const asset = await db.downloadAsset.update({
    where: { id: data.id },
    data: {
      title: buildRequiredLocalizedJson(data.title),
      coverImage: data.coverImage || null,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(asset);
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
  await db.downloadAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
