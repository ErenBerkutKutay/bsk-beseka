import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { saveImageToDatabase } from "@/lib/media/save-image-db";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** public/ altında yazılabilir klasörler (path traversal engeli) */
const ALLOWED_PUBLIC_SUBDIRS = new Set(["uploads", "beseka/banners"]);

export type SaveImageOptions = {
  /** public/ altındaki hedef klasör, örn. "beseka/banners" */
  publicSubdir?: string;
};

function resolvePublicSubdir(publicSubdir?: string) {
  const subdir = publicSubdir?.replace(/^\/+|\/+$/g, "") || "uploads";
  if (!ALLOWED_PUBLIC_SUBDIRS.has(subdir)) {
    throw new Error("Geçersiz yükleme klasörü.");
  }
  return subdir;
}

async function saveToPublicDir(
  buffer: Buffer,
  filename: string,
  publicSubdir: string,
) {
  const uploadDir = path.join(process.cwd(), "public", ...publicSubdir.split("/"));
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/${publicSubdir}/${filename}`;
}

export async function saveImageBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  alt?: string,
  options?: SaveImageOptions,
) {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : ".jpg";
  const filename = `${randomUUID()}${safeExt}`;
  const publicSubdir = resolvePublicSubdir(options?.publicSubdir);
  const resolvedMimeType = mimeType || "application/octet-stream";

  let url: string;
  let media;

  if (process.env.VERCEL === "1") {
    ({ url, media } = await saveImageToDatabase(buffer, filename, resolvedMimeType, alt));
  } else {
    url = await saveToPublicDir(buffer, filename, publicSubdir);
    media = await db.media.create({
      data: {
        filename,
        url,
        mimeType: resolvedMimeType,
        size: buffer.length,
        alt,
      },
    });
  }

  return { url, media };
}
