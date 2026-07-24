import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  adminDownloadAssetSchema,
  buildRequiredLocalizedJson,
} from "@/lib/admin/content-schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assets = await db.downloadAsset.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(assets);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = adminDownloadAssetSchema.parse(await request.json());

  const asset = await db.downloadAsset.create({
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

  return NextResponse.json(asset, { status: 201 });
}
