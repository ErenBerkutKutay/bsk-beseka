import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  hasFirebaseAdminCredentials,
  uploadToFirebaseStorage,
} from "@/lib/media/firebase-storage";

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

function shouldUseCloudStorage() {
  if (process.env.VERCEL === "1") return true;
  return hasFirebaseAdminCredentials();
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

  let url: string;

  if (shouldUseCloudStorage()) {
    if (!hasFirebaseAdminCredentials()) {
      throw new Error(
        "Canlı ortamda görsel yüklemek için Vercel'de FIREBASE_SERVICE_ACCOUNT_JSON tanımlayın.",
      );
    }
    url = await uploadToFirebaseStorage(
      buffer,
      filename,
      mimeType || "application/octet-stream",
      publicSubdir,
    );
  } else {
    url = await saveToPublicDir(buffer, filename, publicSubdir);
  }

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
