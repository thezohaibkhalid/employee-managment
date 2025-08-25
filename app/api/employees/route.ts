// app/api/employees/route.ts
import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/api/employees";

export const dynamic = "force-dynamic";

// GET /api/employees -> list
export async function GET() {
  try {
    const rows = await getEmployees();
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/employees error:", e);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// POST /api/employees -> create
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // minimal validation
    if (!body?.name || !body?.designationId) {
      return NextResponse.json({ error: "name and designationId are required" }, { status: 400 });
    }

    // coerce number-ish fields from forms
    const payload = {
      ...body,
      fixedMonthlySalary:
        body.fixedMonthlySalary === "" || body.fixedMonthlySalary == null
          ? undefined
          : Number(body.fixedMonthlySalary),
    };

    const created = await createEmployee(payload);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/employees error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create employee" }, { status: 500 });
  }
}
