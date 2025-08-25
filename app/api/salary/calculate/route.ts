// app/api/salary/calculate/route.ts
import { NextResponse } from "next/server";
import { calculateMonthlySalary } from "@/lib/api/salary";

export const dynamic = "force-dynamic";

// POST /api/salary/calculate
// { employeeId, month, year, workingDays, fridayDays?, normalLeaves?, fridayLeaves?, holidays? }
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const {
      employeeId,
      month,
      year,
      workingDays,
      fridayDays = 0,
      normalLeaves = 0,
      fridayLeaves = 0,
      holidays = 0,
    } = payload || {};

    if (!employeeId || month == null || year == null || workingDays == null) {
      return NextResponse.json(
        { error: "employeeId, month, year, workingDays are required" },
        { status: 400 }
      );
    }

    const result = await calculateMonthlySalary(
      String(employeeId),
      Number(month),
      Number(year),
      Number(workingDays),
      Number(fridayDays),
      Number(normalLeaves),
      Number(fridayLeaves),
      Number(holidays)
    );

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("POST /api/salary/calculate error:", e);
    return NextResponse.json({ error: e?.message || "Failed to calculate salary" }, { status: 500 });
  }
}
