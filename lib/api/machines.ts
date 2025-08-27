import { prisma } from "@/lib/prisma"
import type { MachineType } from "@prisma/client"

/* ==========================================================
   Machines (CRUD)
========================================================== */

export async function getMachines() {
  try {
    const machines = await prisma.machine.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
    })
    return machines
  } catch (error) {
    console.error("Error fetching machines:", error)
    throw error
  }
}

export async function getMachine(id: string) {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: { company: true },
    })
    return machine
  } catch (error) {
    console.error("Error fetching machine:", error)
    throw error
  }
}

export async function createMachine(data: {
  name: string
  companyName: string
  machineType: MachineType
}) {
  try {
    let company = await prisma.machineCompany.findUnique({ where: { name: data.companyName } })
    if (!company) {
      company = await prisma.machineCompany.create({ data: { name: data.companyName } })
    }

    const machine = await prisma.machine.create({
      data: {
        name: data.name,
        companyId: company.id,
        machineType: data.machineType,
      },
      include: { company: true },
    })

    return machine
  } catch (error) {
    console.error("Error creating machine:", error)
    throw error
  }
}

export async function updateMachine(
  id: string,
  data: { name?: string; companyName?: string; machineType?: MachineType },
) {
  try {
    let companyId: string | undefined

    if (data.companyName) {
      let company = await prisma.machineCompany.findUnique({ where: { name: data.companyName } })
      if (!company) {
        company = await prisma.machineCompany.create({ data: { name: data.companyName } })
      }
      companyId = company.id
    }

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(companyId && { companyId }),
        ...(data.machineType && { machineType: data.machineType }),
      },
      include: { company: true },
    })

    return machine
  } catch (error) {
    console.error("Error updating machine:", error)
    throw error
  }
}

export async function deleteMachine(id: string) {
  try {
    await prisma.machine.delete({ where: { id } })
  } catch (error) {
    console.error("Error deleting machine:", error)
    throw error
  }
}

/* ==========================================================
   MachineType-first APIs (preferred)
   Upload / edit rates for ALL machines of a given type
========================================================== */

export async function upsertBonusRatesForMachineType(
  machineType: MachineType,
  rows: { bonusType: "2 head" | "sheet"; rate: number; stitchCount: number }[],
) {
  try {
    await prisma.machineTypeBonusTier.deleteMany({ where: { machineType } })

    // Merge rows that share the same minStitches, filling twoHead/sheet columns.
    const map = new Map<
      number,
      { minStitches: number; maxStitches: number | null; rateTwoHead: number; rateSheet: number }
    >()

    for (const r of rows) {
      const key = r.stitchCount
      if (!map.has(key)) map.set(key, { minStitches: key, maxStitches: null, rateTwoHead: 0, rateSheet: 0 })
      const rec = map.get(key)!
      if (r.bonusType === "2 head") rec.rateTwoHead = r.rate
      if (r.bonusType === "sheet") rec.rateSheet = r.rate
    }

    const tiers = Array.from(map.values())
      .filter(t => t.rateTwoHead > 0 || t.rateSheet > 0)
      .sort((a, b) => a.minStitches - b.minStitches)

    if (tiers.length) {
      await prisma.machineTypeBonusTier.createMany({
        data: tiers.map(t => ({ machineType, ...t })),
      })
    }

    return tiers
  } catch (error) {
    console.error("Error upserting bonus rates for machine type:", error)
    throw error
  }
}

export async function upsertSalaryRatesForMachineType(
  machineType: MachineType,
  rows: { designation: string; dailyRate: number }[],
) {
  try {
    await prisma.machineTypeSalary.deleteMany({ where: { machineType } })

    const data: { machineType: MachineType; designationId: string; monthlySalary: number }[] = []

    for (const r of rows) {
      const name = r.designation
      const slug = name.toLowerCase().replace(/\s+/g, "-")

      let designation = await prisma.designation.findUnique({ where: { name } })
      if (!designation) {
        designation = await prisma.designation.create({
          data: {
            name,
            slug,
            isVariablePay: ["operator", "karigar", "helper"].includes(name.toLowerCase()),
          },
        })
      }

      // Daily → monthly (if you want month-specific days, pass it from UI)
      data.push({ machineType, designationId: designation.id, monthlySalary: r.dailyRate * 30 })
    }

    if (data.length) {
      await prisma.machineTypeSalary.createMany({ data })
    }
    return data
  } catch (error) {
    console.error("Error upserting salary rates for machine type:", error)
    throw error
  }
}

export async function getBonusRatesByMachineType(machineType: MachineType) {
  try {
    return await prisma.machineTypeBonusTier.findMany({
      where: { machineType },
      orderBy: { minStitches: "asc" },
    })
  } catch (error) {
    console.error("Error fetching bonus rates by machine type:", error)
    throw error
  }
}

export async function getSalaryRatesByMachineType(machineType: MachineType) {
  try {
    return await prisma.machineTypeSalary.findMany({
      where: { machineType },
      include: { designation: true },
      orderBy: { designation: { name: "asc" } },
    })
  } catch (error) {
    console.error("Error fetching salary rates by machine type:", error)
    throw error
  }
}

export async function getMachineRatesByType(machineType: MachineType) {
  try {
    const [bonusRates, salaryRates] = await Promise.all([
      getBonusRatesByMachineType(machineType),
      getSalaryRatesByMachineType(machineType),
    ])
    return { bonusRates, salaryRates }
  } catch (error) {
    console.error("Error fetching machine-type rates:", error)
    throw error
  }
}

/* ==========================================================
   Backwards-compat wrappers (accept machineId)
========================================================== */

export async function updateMachineBonusRates(
  machineId: string,
  bonusRates: { bonusType: string; rate: number; stitchCount: number }[],
) {
  try {
    const m = await prisma.machine.findUnique({ where: { id: machineId }, select: { machineType: true } })
    if (!m) throw new Error("Machine not found")
    const rows = bonusRates.map(r => ({
      bonusType: (r.bonusType === "2 head" ? "2 head" : "sheet") as "2 head" | "sheet",
      rate: Number(r.rate),
      stitchCount: Number(r.stitchCount),
    }))
    return await upsertBonusRatesForMachineType(m.machineType, rows)
  } catch (error) {
    console.error("Error updating machine bonus rates (by id):", error)
    throw error
  }
}

export async function updateMachineSalaryRates(
  machineId: string,
  salaryRates: { designation: string; dailyRate: number }[],
) {
  try {
    const m = await prisma.machine.findUnique({ where: { id: machineId }, select: { machineType: true } })
    if (!m) throw new Error("Machine not found")
    return await upsertSalaryRatesForMachineType(
      m.machineType,
      salaryRates.map(r => ({ designation: r.designation, dailyRate: Number(r.dailyRate) })),
    )
  } catch (error) {
    console.error("Error updating machine salary rates (by id):", error)
    throw error
  }
}

export async function getMachineBonusRates(machineId: string) {
  try {
    const m = await prisma.machine.findUnique({ where: { id: machineId }, select: { machineType: true } })
    if (!m) return []
    return await getBonusRatesByMachineType(m.machineType)
  } catch (error) {
    console.error("Error fetching machine bonus rates (by id):", error)
    throw error
  }
}

export async function getMachineSalaryRates(machineId: string) {
  try {
    const m = await prisma.machine.findUnique({ where: { id: machineId }, select: { machineType: true } })
    if (!m) return []
    return await getSalaryRatesByMachineType(m.machineType)
  } catch (error) {
    console.error("Error fetching machine salary rates (by id):", error)
    throw error
  }
}

export async function getMachineRates(machineId: string) {
  try {
    const m = await prisma.machine.findUnique({ where: { id: machineId }, select: { machineType: true } })
    if (!m) return { bonusRates: [], salaryRates: [] }
    return await getMachineRatesByType(m.machineType)
  } catch (error) {
    console.error("Error fetching machine rates (by id):", error)
    throw error
  }
}

/* ==========================================================
   Bonus calculation helper (STEP PRICING — flat tier amounts)
   Example CSV:
     stitches, 2 head, sheet
     500000,   100,    200
     600000,   200,    400
   Logic:
     - Find the tier with the HIGHEST minStitches <= stitchCount
     - Return that tier’s flat amount for the selected bonus type
     - No division by 1,000 and no per-stitch multiply
========================================================== */

export function calculateBonusAmount(
  stitchCount: number,
  bonusType: "TWO_HEAD" | "SHEET",
  tiers: { minStitches: number; rateTwoHead: number; rateSheet: number }[],
): number {
  if (!tiers?.length) return 0

  // pick the best (highest) threshold not exceeding the stitchCount
  const tier = tiers
    .filter(t => t.minStitches <= stitchCount)
    .sort((a, b) => b.minStitches - a.minStitches)[0]

  if (!tier) return 0

  return bonusType === "TWO_HEAD" ? Number(tier.rateTwoHead) : Number(tier.rateSheet)
}
