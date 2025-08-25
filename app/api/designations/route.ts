// app/api/designations/route.ts
import { NextResponse } from "next/server";
import { getDesignations, createDesignation } from "@/lib/api/designations";

export const dynamic = "force-dynamic";

// GET /api/designations -> list
export async function GET() {
  try {
    const rows = await getDesignations();
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/designations error:", e);
    return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
  }
}

// POST /api/designations -> create
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expects: { name: string, isVariablePay: boolean, notes?: string }
    if (!body?.name || typeof body.isVariablePay !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const created = await createDesignation(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/designations error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create designation" }, { status: 500 });
  }
}
