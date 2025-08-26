// app/api/machines/[id]/bonus/route.ts
import { NextResponse } from "next/server";
import { updateMachineBonusRates } from "@/lib/api/machines";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();

    // Accept either normalized or CSV-like rows
    let bonusRates = body?.bonusRates as
      | { bonusType: string; rate: number; stitchCount: number }[]
      | undefined;

    // If someone sends CSV rows here, normalize on the server too
    if (!bonusRates && Array.isArray(body?.rows)) {
      bonusRates = (body.rows as any[]).flatMap((r) => {
        const stitchCount =
          Number(r.num_of_stiches ?? r.num_of_stitches ?? r.stitchCount ?? 0) || 0;
        const out: any[] = [];
        if (r["2 head"] != null && r["2 head"] !== "" && !Number.isNaN(Number(r["2 head"]))) {
          out.push({ bonusType: "2 head", rate: Number(r["2 head"]), stitchCount });
        }
        if (r["sheet"] != null && r["sheet"] !== "" && !Number.isNaN(Number(r["sheet"]))) {
          out.push({ bonusType: "sheet", rate: Number(r["sheet"]), stitchCount });
        }
        return out;
      });
    }

    if (!bonusRates?.length) {
      return NextResponse.json({ error: "bonusRates is required" }, { status: 400 });
    }

    const result = await updateMachineBonusRates(params.id, bonusRates);
    return NextResponse.json({ ok: true, count: result.length });
  } catch (e: any) {
    console.error("PUT /api/machines/[id]/bonus error:", e);
    return NextResponse.json({ error: e?.message || "Failed to update bonus rates" }, { status: 500 });
  }
}
