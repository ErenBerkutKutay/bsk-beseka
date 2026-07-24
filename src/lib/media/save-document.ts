import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { saveImageToDatabase } from "@/lib/media/save-image-db";

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".zip",
  ".svg",
  ".ai",
  ".eps",
]);

const ALLOWED_PUBLIC_SUBDIRS = new Set(["uploads", "uploads/downloads"]);

function resolvePublicSubdir(publicSubdir?: string) {
  const subdir = publicSubdir?.replace(/^\/+|\/+$/g, "") || "uploads/downloads";
  if (!ALLOWED_PUBLIC_SUBDIRS.has(subdir)) {
    throw new Error("Geçersiz yükleme klasörü.");
  }
  return subdir;
}

async function saveToPublicDir(buffer: Buffer, filename: string, publicSubdir: string) {
  const uploadDir = path.join(process.cwd(), "public", ...publicSubdir.split("/"));
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/${publicSubdir}/${filename}`;
}

export async function saveDocumentBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  publicSubdir = "uploads/downloads",
) {
  const ext = path.extname(originalName).toLowerCase() || ".pdf";
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : ".pdf";
  const filename = `${randomUUID()}${safeExt}`;
  const resolvedSubdir = resolvePublicSubdir(publicSubdir);
  const resolvedMimeType = mimeType || "application/octet-stream";

  if (process.env.VERCEL === "1") {
    const { url, media } = await saveImageToDatabase(buffer, filename, resolvedMimeType);
    return { url, fileName: originalName, mimeType: resolvedMimeType, size: buffer.length, mediaId: media.id };
  }

  const url = await saveToPublicDir(buffer, filename, resolvedSubdir);
  const media = await db.media.create({
    data: {
      filename,
      url,
      mimeType: resolvedMimeType,
      size: buffer.length,
    },
  });

  return { url, fileName: originalName, mimeType: resolvedMimeType, size: buffer.length, mediaId: media.id };
}
