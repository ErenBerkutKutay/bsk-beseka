import { readFileSync } from "node:fs";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";

function parseServiceAccount(): ServiceAccount | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json) as ServiceAccount;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON geçersiz JSON.");
    }
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath) {
    return JSON.parse(readFileSync(keyPath, "utf8")) as ServiceAccount;
  }

  return null;
}

export function resolveFirebaseStorageBucket(projectId: string) {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`
  );
}

/** Sunucu tarafı Firebase Admin (Storage, custom token vb.). */
export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = parseServiceAccount();
  if (serviceAccount) {
    const projectId =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      (serviceAccount as ServiceAccount & { project_id?: string }).project_id ??
      "beseka-encom";

    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket: resolveFirebaseStorageBucket(projectId),
    });
  }

  // Firebase App Hosting / Cloud Run: varsayılan kimlik bilgileri
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "beseka-encom";
  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket: resolveFirebaseStorageBucket(projectId),
  });
}
