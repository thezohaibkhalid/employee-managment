// app/api/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { getEmployee, updateEmployee, deleteEmployee } from "@/lib/api/employees";

export const dynamic = "force-dynamic";

// (optional) GET /api/employees/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const row = await getEmployee(params.id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET /api/employees/[id] error:", e);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

// PATCH /api/employees/:id -> update
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const payload = {
      ...body,
      fixedMonthlySalary:
        body.fixedMonthlySalary === "" || body.fixedMonthlySalary == null
          ? undefined
          : Number(body.fixedMonthlySalary),
    };

    const updated = await updateEmployee(params.id, payload);
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/employees/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Failed to update employee" }, { status: 400 });
  }
}

// DELETE /api/employees/:id -> delete
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteEmployee(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/employees/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Failed to delete employee" }, { status: 400 });
  }
}
