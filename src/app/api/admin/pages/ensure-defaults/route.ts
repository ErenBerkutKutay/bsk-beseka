import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureDefaultPages } from "@/lib/pages/default-pages";
import { z } from "zod";

const bodySchema = z.object({
  scope: z.enum(["contact", "quality", "all"]).default("all"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { scope } = bodySchema.parse(body);
    await ensureDefaultPages(scope);
    return NextResponse.json({ ok: true, scope });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sayfalar oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
