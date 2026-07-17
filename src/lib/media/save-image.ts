import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function saveImageBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  alt?: string,
) {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : ".jpg";
  const filename = `${randomUUID()}${safeExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const url = `/uploads/${filename}`;
  const media = await db.media.create({
    data: {
      filename,
      url,
      mimeType: mimeType || "application/octet-stream",
      size: buffer.length,
      alt,
    },
  });

  return { url, media };
}
