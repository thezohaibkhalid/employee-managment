
import { NextResponse } from "next/server";
import { getSalaryRecords, createSalaryRecord } from "@/lib/api/salary-records";

export const dynamic = "force-dynamic";

// GET /api/salary/records?employeeId=&month=&year=
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get("employeeId") ?? undefined;
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    const rows = await getSalaryRecords(
      employeeId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined
    );

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/salary/records error:", e);
    return NextResponse.json({ error: "Failed to fetch salary records" }, { status: 500 });
  }
}

// POST /api/salary/records
// Accepts a single record or an array (bulk insert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const created = await Promise.all(body.map((r) => createSalaryRecord(r)));
      return NextResponse.json(created, { status: 201 });
    }
    const created = await createSalaryRecord(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/salary/records error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create salary record" }, { status: 500 });
  }
}
