import { getStorage } from "firebase-admin/storage";
import { getFirebaseAdminApp } from "@/lib/firebase-admin";

export function hasFirebaseAdminCredentials() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

function formatFirebaseUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("The specified bucket does not exist")) {
    return (
      "Firebase Storage bucket bulunamadı. Firebase Console → Storage → Başlayın ile depolamayı etkinleştirin, " +
      "sonra Vercel'de NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET değerini oluşturulan bucket adıyla güncelleyin."
    );
  }
  return message;
}

export async function uploadToFirebaseStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  objectPrefix = "uploads",
): Promise<string> {
  const safePrefix = objectPrefix.replace(/^\/+|\/+$/g, "");
  const bucket = getStorage(getFirebaseAdminApp()).bucket();
  const objectPath = `${safePrefix}/${filename}`;
  const file = bucket.file(objectPath);

  try {
    await file.save(buffer, {
      metadata: { contentType: mimeType },
    });
    await file.makePublic();
  } catch (error) {
    throw new Error(formatFirebaseUploadError(error));
  }

  return `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
}
