import { NextResponse } from "next/server";
import { getPayrollRuns } from "@/lib/api/payroll";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const machineId = url.searchParams.get("machineId");

    const runs = await getPayrollRuns({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      machineId: machineId || undefined,
    });

    return NextResponse.json(runs);
  } catch (e) {
    console.error("GET /api/payroll/runs error:", e);
    return NextResponse.json({ error: "Failed to fetch payroll runs" }, { status: 500 });
  }
}
