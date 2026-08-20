import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  importBulkVehicleCross,
  previewBulkVehicleCross,
} from "@/lib/products/bulk-vehicle-cross-import";
import { parseBulkVehicleCrossCsv } from "@/lib/products/bulk-vehicle-cross-parse";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const dryRun = body.dryRun !== false;

  let rows;
  let parseErrors;

  if (Array.isArray(body.rows)) {
    rows = body.rows
      .map((row: { line?: number; sku?: string; tipNo?: number }, index: number) => ({
        line: row.line || index + 1,
        sku: String(row.sku || "")
          .trim()
          .toUpperCase(),
        tipNo: Number(row.tipNo),
      }))
      .filter((row: { sku: string; tipNo: number }) => row.sku && Number.isFinite(row.tipNo) && row.tipNo > 0);
    parseErrors = Array.isArray(body.parseErrors) ? body.parseErrors : [];
  } else {
    const csv = body.csv as string | undefined;
    if (!csv?.trim()) {
      return NextResponse.json({ error: "Dosya içeriği gerekli" }, { status: 400 });
    }
    const parsed = parseBulkVehicleCrossCsv(csv);
    rows = parsed.rows;
    parseErrors = parsed.errors;
  }

  if (!rows.length && parseErrors.length) {
    return NextResponse.json(
      {
        error: parseErrors[0]?.message || "Geçerli satır bulunamadı",
        parseErrors,
        total: 0,
        linked: 0,
        duplicate: 0,
        productNotFound: 0,
        vehicleNotFound: 0,
        invalid: parseErrors.length,
        rows: [],
      },
      { status: 400 },
    );
  }

  const result = dryRun
    ? await previewBulkVehicleCross(rows, parseErrors)
    : await importBulkVehicleCross(rows, parseErrors);

  return NextResponse.json(result);
}
