import { NextResponse } from "next/server";
import { getPayslips } from "@/lib/api/payroll";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const employeeId = url.searchParams.get("employeeId");
    const payrollRunId = url.searchParams.get("payrollRunId");

    const rows = await getPayslips({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      employeeId: employeeId || undefined,
      payrollRunId: payrollRunId || undefined,
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/payroll/payslips error:", e);
    return NextResponse.json({ error: "Failed to fetch payslips" }, { status: 500 });
  }
}
