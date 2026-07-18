import { getStorage } from "firebase-admin/storage";
import { getFirebaseAdminApp } from "@/lib/firebase-admin";

export function hasFirebaseAdminCredentials() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
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

  await file.save(buffer, {
    metadata: { contentType: mimeType },
  });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
}
