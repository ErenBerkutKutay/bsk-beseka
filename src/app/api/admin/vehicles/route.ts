import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { buildVehicleTypeFromManual } from "@/lib/vehicles/parse-vehicle-types";
import { createVehicleTypeManual } from "@/lib/vehicles/import-vehicle-types";

const manualVehicleSchema = z.object({
  id: z.number().int().positive(),
  make: z.string().trim().min(1, "Marka gerekli"),
  model: z.string().trim().min(1, "Model gerekli"),
  motorInfo: z.string().trim().min(1, "Motor bilgisi gerekli"),
  yearFrom: z.number().int().min(1900).max(2100).nullable().optional(),
  yearTo: z.number().int().min(1900).max(2100).nullable().optional(),
  engineVolumeL: z.number().positive().nullable().optional(),
  engineVolumeCcm: z.number().int().positive().nullable().optional(),
  fuelType: z.string().trim().nullable().optional(),
  kw: z.number().int().positive().nullable().optional(),
  hp: z.number().int().positive().nullable().optional(),
  engineCodes: z.string().trim().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = manualVehicleSchema.parse(body);
  const parsed = buildVehicleTypeFromManual(data);

  if (!parsed) {
    return NextResponse.json({ error: "Geçersiz araç bilgisi" }, { status: 400 });
  }

  const result = await createVehicleTypeManual(parsed, {
    importedBy: session.user.email || undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        duplicateIds: result.duplicateIds,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, tipNo: result.tipNo });
}
