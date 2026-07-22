import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVehicleCatalogStats, importVehicleTypesFromBuffer } from "@/lib/vehicles/import-vehicle-types";
import { syncVehicleCatalog } from "@/lib/vehicles/sync-vehicle-catalog";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getVehicleCatalogStats();
  return NextResponse.json(stats);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const syncBundled = formData.get("syncBundled") === "true";

  if (syncBundled) {
    const result = await syncVehicleCatalog({
      importedBy: session.user.email || undefined,
      purgeStale: true,
      skipLog: true,
    });

    if (result.skipped) {
      return NextResponse.json({ error: "data/data.xlsx bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(result);
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Excel dosyası gerekli" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const result = await importVehicleTypesFromBuffer(buffer, {
    fileName: file.name,
    importedBy: session.user.email || undefined,
    purgeStale: true,
  });

  return NextResponse.json(result);
}
