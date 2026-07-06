import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const makes = await db.vehicleMake.findMany({
    include: {
      models: {
        include: { subModels: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(makes);
}
