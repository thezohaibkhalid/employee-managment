import { NextResponse } from "next/server"
import { upsertBonusRatesForMachineType } from "@/lib/api/machines"
import type { MachineType } from "@prisma/client"

export const dynamic = "force-dynamic"

type Ctx = { params: { type: MachineType } }

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json()
    const rows = (body?.bonusRates ?? []) as {
      bonusType: "2 head" | "sheet"
      rate: number
      stitchCount: number
    }[]

    if (!rows.length) {
      return NextResponse.json({ error: "bonusRates is required" }, { status: 400 })
    }

    const result = await upsertBonusRatesForMachineType(
      params.type,
      rows.map(r => ({
        bonusType: r.bonusType,
        rate: Number(r.rate),
        stitchCount: Number(r.stitchCount),
      })),
    )

    return NextResponse.json({ ok: true, count: result.length })
  } catch (e: any) {
    console.error("PUT /api/machine-types/[type]/bonus error:", e)
    return NextResponse.json({ error: e?.message || "Failed to upsert bonus rates" }, { status: 500 })
  }
}
