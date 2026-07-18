import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = await db.media.findUnique({ where: { id } });

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (media.data) {
    return new NextResponse(new Uint8Array(media.data), {
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (media.url.startsWith("http://") || media.url.startsWith("https://")) {
    return NextResponse.redirect(media.url);
  }

  if (media.url.startsWith("/")) {
    return NextResponse.redirect(new URL(media.url, _request.url));
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
