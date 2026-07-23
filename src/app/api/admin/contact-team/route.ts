import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { buildRequiredLocalizedJson } from "@/lib/admin/content-schema";

const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.record(z.string(), z.string()).optional(),
  photo: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await db.contactTeamMember.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = memberSchema.parse(await request.json());
  const member = await db.contactTeamMember.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role || undefined,
      photo: data.photo || null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = memberSchema.extend({ id: z.string().min(1) }).parse(body);

  const member = await db.contactTeamMember.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role || undefined,
      photo: data.photo || null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(member);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  await db.contactTeamMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
