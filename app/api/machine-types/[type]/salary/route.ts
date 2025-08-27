// app/api/machine-types/[type]/salary/route.ts
import { NextResponse } from "next/server";
import { upsertSalaryRatesForMachineType } from "@/lib/api/machines";
import type { MachineType } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: { type: MachineType } };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const rows = (body?.rows ?? []) as { designation: string; dailyRate: number }[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "rows is required" }, { status: 400 });
    }

    const result = await upsertSalaryRatesForMachineType(
      params.type,
      rows.map(r => ({ designation: r.designation, dailyRate: Number(r.dailyRate) }))
    );
    return NextResponse.json({ ok: true, count: result.length });
  } catch (e: any) {
    console.error("PUT /api/machine-types/[type]/salary error:", e);
    return NextResponse.json({ error: e?.message || "Failed to upsert salary rates" }, { status: 500 });
  }
}
