// app/api/machines/[id]/rates/route.ts
import { NextResponse } from "next/server";
import { getMachineRates } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const rates = await getMachineRates(params.id);
    return NextResponse.json(rates);
  } catch (e) {
    console.error("GET /api/machines/[id]/rates error:", e);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
