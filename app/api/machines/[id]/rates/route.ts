// app/api/machines/[id]/rates/route.ts
import { NextResponse } from "next/server";
import { getMachineBonusRates, getMachineSalaryRates } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

// GET /api/machines/:id/rates -> { bonusRates, salaryRates }
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const machineId = params.id;
    const [bonusRates, salaryRates] = await Promise.all([
      getMachineBonusRates(machineId),
      getMachineSalaryRates(machineId),
    ]);
    return NextResponse.json({ bonusRates, salaryRates });
  } catch (error) {
    console.error("GET /api/machines/[id]/rates error:", error);
    return NextResponse.json({ error: "Failed to fetch machine rates" }, { status: 500 });
  }
}
