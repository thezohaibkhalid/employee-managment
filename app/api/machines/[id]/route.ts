// app/api/machines/[id]/route.ts
import { NextResponse } from "next/server";
import { getMachine, updateMachine, deleteMachine } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const row = await getMachine(params.id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET /api/machines/[id] error:", e);
    return NextResponse.json({ error: "Failed to fetch machine" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const updated = await updateMachine(params.id, body);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PUT /api/machines/[id] error:", e);
    return NextResponse.json({ error: "Failed to update machine" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await deleteMachine(params.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/machines/[id] error:", e);
    return NextResponse.json({ error: "Failed to delete machine" }, { status: 500 });
  }
}
