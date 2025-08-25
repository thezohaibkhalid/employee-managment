import { NextResponse } from "next/server";
import { getPayrollSummary } from "@/lib/api/payroll";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    if (!year || !month) {
      return NextResponse.json({ error: "year and month are required" }, { status: 400 });
    }

    const summary = await getPayrollSummary(Number(year), Number(month));
    return NextResponse.json(summary);
  } catch (e) {
    console.error("GET /api/payroll/summary error:", e);
    return NextResponse.json({ error: "Failed to fetch payroll summary" }, { status: 500 });
  }
}
