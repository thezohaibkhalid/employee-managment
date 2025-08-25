// app/api/machines/route.ts
import { NextResponse } from "next/server";
import {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
} from "@/lib/api/machines";

// (optional) avoid caching in edge/CDN if needed
export const dynamic = "force-dynamic";

// GET /api/machines  -> list machines
export async function GET() {
  try {
    const machines = await getMachines();
    return NextResponse.json(machines);
  } catch (error) {
    console.error("GET /api/machines error:", error);
    return NextResponse.json({ error: "Failed to fetch machines" }, { status: 500 });
  }
}

// POST /api/machines  -> create a machine
// body: { name, companyName, machineType }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const machine = await createMachine(body);
    return NextResponse.json(machine);
  } catch (error) {
    console.error("POST /api/machines error:", error);
    return NextResponse.json({ error: "Failed to create machine" }, { status: 500 });
  }
}

// PUT /api/machines?id=...  -> update a machine
// body: { name?, companyName?, machineType? }
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();
    const machine = await updateMachine(id, body);
    return NextResponse.json(machine);
  } catch (error) {
    console.error("PUT /api/machines error:", error);
    return NextResponse.json({ error: "Failed to update machine" }, { status: 500 });
  }
}

// DELETE /api/machines?id=...  -> delete a machine
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await deleteMachine(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/machines error:", error);
    return NextResponse.json({ error: "Failed to delete machine" }, { status: 500 });
  }
}
