import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { importBulkProducts, parseBulkProductCsv } from "@/lib/products/bulk-import";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const csv = body.csv as string | undefined;
  const updateExisting = body.updateExisting !== false;
  const dryRun = body.dryRun === true;

  if (!csv?.trim()) {
    return NextResponse.json({ error: "CSV içeriği gerekli" }, { status: 400 });
  }

  const { rows, errors: parseErrors } = parseBulkProductCsv(csv);

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      total: rows.length,
      parseErrors,
      preview: rows.slice(0, 20),
    });
  }

  const result = await importBulkProducts(rows, { updateExisting });
  result.errors = [...parseErrors, ...result.errors];

  return NextResponse.json({
    ...result,
    total: rows.length,
    parseErrors,
  });
}
