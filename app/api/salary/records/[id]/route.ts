import { NextResponse } from "next/server";
import { updateSalaryRecord, deleteSalaryRecord } from "@/lib/api/salary-records";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json();
    const updated = await updateSalaryRecord(params.id, updates);
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/salary/records/:id error:", e);
    return NextResponse.json({ error: e?.message || "Failed to update salary record" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteSalaryRecord(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/salary/records/:id error:", e);
    return NextResponse.json({ error: e?.message || "Failed to delete salary record" }, { status: 500 });
  }
}
