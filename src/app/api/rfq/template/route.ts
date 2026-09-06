import { NextResponse } from "next/server";
import { createRFQTemplateWorkbook } from "@/lib/rfq/excel-parser";

export async function GET() {
  const buffer = createRFQTemplateWorkbook();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="BSK_RFQ_Sablon.xlsx"',
      "Cache-Control": "no-cache",
    },
  });
}
