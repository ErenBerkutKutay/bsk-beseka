import { NextRequest, NextResponse } from "next/server";
import { parseRFQExcel } from "@/lib/rfq/excel-parser";
import { matchRFQRows, type RFQInputRow } from "@/lib/rfq/cross-matcher";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let rows: RFQInputRow[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Lütfen bir Excel (.xlsx, .xls) veya CSV dosyası yükleyin." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      rows = parseRFQExcel(buffer);

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          {
            error:
              "Yüklenen dosyada geçerli satır veya OEM verisi bulunamadı. Lütfen şablon formatına uygun doldurunuz.",
          },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      rows = body.rows || [];

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "Geçerli bir satır listesi iletilmedi." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Desteklenmeyen istek formatı (multipart/form-data veya application/json bekleniyor)." },
        { status: 415 }
      );
    }

    console.log(`[RFQ API] Parsed ${rows.length} rows. First 3 rows:`, rows.slice(0, 3));

    const matchResponse = await matchRFQRows(rows);

    console.log(`[RFQ API] Match summary:`, matchResponse.summary);

    return NextResponse.json({
      success: true,
      ...matchResponse,
    });
  } catch (error) {
    console.error("RFQ match error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Eşleştirme işlemi sırasında beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
