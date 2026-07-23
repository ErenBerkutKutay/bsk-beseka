import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactRouteSlug } from "@/lib/contact/page-metadata";
import { getLocalizedText } from "@/lib/utils";

export async function GET() {
  const pages = await db.page.findMany({
    where: { type: "CONTACT", isActive: true },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
  });

  return NextResponse.json(
    pages.map((page) => ({
      slug: contactRouteSlug(page.slug),
      href: `/iletisim/${contactRouteSlug(page.slug)}`,
      label: getLocalizedText(page.title as { tr: string }, "tr"),
    })),
  );
}
