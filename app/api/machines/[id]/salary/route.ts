// app/api/machines/[id]/salary/route.ts
import { NextResponse } from "next/server";
import { updateMachineSalaryRates } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

// PUT /api/machines/:id/salary
// body: { salaryRates: { designation: string; dailyRate: number }[] }
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { salaryRates } = await req.json();

    if (!Array.isArray(salaryRates)) {
      return NextResponse.json({ error: "salaryRates must be an array" }, { status: 400 });
    }

    const result = await updateMachineSalaryRates(id, salaryRates);
    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/machines/[id]/salary error:", error);
    return NextResponse.json({ error: "Failed to update salary rates" }, { status: 500 });
  }
}
