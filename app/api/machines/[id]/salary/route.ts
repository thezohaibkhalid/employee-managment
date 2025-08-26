// app/api/machines/[id]/salary/route.ts
import { NextResponse } from "next/server";
import { updateMachineSalaryRates } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const salaryRates = body?.salaryRates as { designation: string; dailyRate: number }[] | undefined;

    if (!salaryRates?.length) {
      return NextResponse.json({ error: "salaryRates is required" }, { status: 400 });
    }

    const result = await updateMachineSalaryRates(params.id, salaryRates);
    return NextResponse.json({ ok: true, count: result.length });
  } catch (e: any) {
    console.error("PUT /api/machines/[id]/salary error:", e);
    return NextResponse.json({ error: e?.message || "Failed to update salary rates" }, { status: 500 });
  }
}
