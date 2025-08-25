// app/api/designations/[id]/route.ts
import { NextResponse } from "next/server";
import { getDesignation, updateDesignation, deleteDesignation } from "@/lib/api/designations";

export const dynamic = "force-dynamic";

// (optional) GET /api/designations/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const row = await getDesignation(params.id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET /api/designations/[id] error:", e);
    return NextResponse.json({ error: "Failed to fetch designation" }, { status: 500 });
  }
}

// PATCH /api/designations/:id -> update
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateDesignation(params.id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/designations/[id] error:", e);
    // validation/usage errors from your lib function should be 400
    return NextResponse.json({ error: e?.message || "Failed to update designation" }, { status: 400 });
  }
}

// DELETE /api/designations/:id -> delete
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteDesignation(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/designations/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Failed to delete designation" }, { status: 400 });
  }
}
