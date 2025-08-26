// app/api/machines/route.ts
import { NextResponse } from "next/server";
import { getMachines, createMachine } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getMachines();
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/machines error:", e);
    return NextResponse.json({ error: "Failed to fetch machines" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || !body?.companyName || !body?.machineType) {
      return NextResponse.json({ error: "name, companyName, machineType are required" }, { status: 400 });
    }
    const created = await createMachine(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/machines error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create machine" }, { status: 500 });
  }
}
