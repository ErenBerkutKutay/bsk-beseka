import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await db.fitmentImportLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.nextUrl.searchParams.get("all") === "true") {
    const result = await db.fitmentImportLog.deleteMany();
    return NextResponse.json({ deleted: result.count });
  }

  return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
}

