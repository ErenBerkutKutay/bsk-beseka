import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveImageBuffer } from "@/lib/media/save-image";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const alt = (formData.get("alt") as string) || undefined;
  const folder = (formData.get("folder") as string) || undefined;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const media = await saveImageBuffer(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      alt,
      { publicSubdir: folder },
    );

    return NextResponse.json(media.media);
  } catch (error) {
    console.error("[upload]", error);
    const message =
      error instanceof Error ? error.message : "Görsel yüklenemedi. Lütfen tekrar deneyin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
