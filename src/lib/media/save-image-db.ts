import { db } from "@/lib/db";

const MAX_DB_IMAGE_BYTES = 4 * 1024 * 1024;

export async function saveImageToDatabase(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  alt?: string,
) {
  if (buffer.length > MAX_DB_IMAGE_BYTES) {
    throw new Error("Görsel en fazla 4 MB olabilir.");
  }

  const media = await db.media.create({
    data: {
      filename,
      url: "pending",
      mimeType,
      size: buffer.length,
      alt,
      data: new Uint8Array(buffer),
    },
  });

  const url = `/api/media/${media.id}`;
  await db.media.update({
    where: { id: media.id },
    data: { url },
  });

  return { url, media: { ...media, url } };
}
