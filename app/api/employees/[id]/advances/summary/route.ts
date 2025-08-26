// app/api/employees/[id]/advances/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    if (!params.id || !year || !month) {
      return NextResponse.json({ error: "id, year, month are required" }, { status: 400 });
    }
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const agg = await prisma.employeeAdvance.aggregate({
      _sum: { amount: true },
      where: { employeeId: params.id, takenOn: { gte: start, lt: end } },
    });

    const total = Number(agg._sum.amount ?? 0);
    return NextResponse.json({ total });
  } catch (e) {
    console.error("GET /api/employees/[id]/advances/summary error:", e);
    return NextResponse.json({ error: "Failed to fetch advance summary" }, { status: 500 });
  }
}
