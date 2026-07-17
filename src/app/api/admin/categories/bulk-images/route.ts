import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  importBulkCategoryImage,
  previewBulkCategoryImages,
} from "@/lib/categories/bulk-category-image-import";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const filenames = Array.isArray(body.filenames) ? (body.filenames as string[]) : [];

    if (!filenames.length) {
      return NextResponse.json({ error: "Dosya adları gerekli" }, { status: 400 });
    }

    const rows = await previewBulkCategoryImages(filenames, {
      skipExisting: body.skipExisting === true,
    });

    return NextResponse.json({
      total: filenames.length,
      ready: rows.filter((r) => r.status === "ready").length,
      skipped: rows.filter((r) => r.status === "skipped").length,
      notFound: rows.filter((r) => r.status === "not_found").length,
      invalid: rows.filter((r) => r.status === "invalid_name").length,
      rows,
    });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importBulkCategoryImage(
    {
      filename: file.name,
      buffer,
      mimeType: file.type || "application/octet-stream",
    },
    {
      skipExisting: formData.get("skipExisting") === "true",
    },
  );

  return NextResponse.json(result);
}
