import { prisma } from "@/lib/prisma"
import type { MachineType } from "@prisma/client"

export async function getMachines() {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: "desc",
      },
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
      include: {
        company: true,
      },
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
    // First, find or create the company
    let company = await prisma.machineCompany.findUnique({
      where: { name: data.companyName },
    })

    if (!company) {
      company = await prisma.machineCompany.create({
        data: { name: data.companyName },
      })
    }

    const machine = await prisma.machine.create({
      data: {
        name: data.name,
        companyId: company.id,
        machineType: data.machineType,
      },
      include: {
        company: true,
      },
    })

    return machine
  } catch (error) {
    console.error("Error creating machine:", error)
    throw error
  }
}

export async function updateMachine(
  id: string,
  data: {
    name?: string
    companyName?: string
    machineType?: MachineType
  },
) {
  try {
    let companyId: string | undefined

    if (data.companyName) {
      let company = await prisma.machineCompany.findUnique({
        where: { name: data.companyName },
      })

      if (!company) {
        company = await prisma.machineCompany.create({
          data: { name: data.companyName },
        })
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
      include: {
        company: true,
      },
    })

    return machine
  } catch (error) {
    console.error("Error updating machine:", error)
    throw error
  }
}

export async function deleteMachine(id: string) {
  try {
    await prisma.machine.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting machine:", error)
    throw error
  }
}

export async function updateMachineBonusRates(
  machineId: string,
  bonusRates: { bonusType: string; rate: number; stitchCount: number }[],
) {
  try {
    // Get the machine to know its type
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    })

    if (!machine) {
      throw new Error("Machine not found")
    }

    // Delete existing bonus rates for this machine type
    await prisma.machineTypeBonusTier.deleteMany({
      where: { machineType: machine.machineType },
    })

    // Create new bonus rates
    const bonusData = bonusRates.map((rate) => ({
      machineType: machine.machineType,
      minStitches: rate.stitchCount,
      maxStitches: null, // Open-ended for now
      rateTwoHead: rate.bonusType === "2 head" ? rate.rate : 0,
      rateSheet: rate.bonusType === "sheet" ? rate.rate : 0,
    }))

    // Group by stitch count and combine rates
    const groupedRates = bonusData.reduce(
      (acc, curr) => {
        const key = curr.minStitches
        if (!acc[key]) {
          acc[key] = {
            machineType: curr.machineType,
            minStitches: curr.minStitches,
            maxStitches: curr.maxStitches,
            rateTwoHead: 0,
            rateSheet: 0,
          }
        }
        acc[key].rateTwoHead += curr.rateTwoHead
        acc[key].rateSheet += curr.rateSheet
        return acc
      },
      {} as Record<number, any>,
    )

    const finalRates = Object.values(groupedRates).filter((rate) => rate.rateTwoHead > 0 || rate.rateSheet > 0)

    if (finalRates.length > 0) {
      await prisma.machineTypeBonusTier.createMany({
        data: finalRates,
      })
    }

    return finalRates
  } catch (error) {
    console.error("Error updating machine bonus rates:", error)
    throw error
  }
}

export async function updateMachineSalaryRates(
  machineId: string,
  salaryRates: { designation: string; dailyRate: number }[],
) {
  try {
    // Get the machine to know its type
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    })

    if (!machine) {
      throw new Error("Machine not found")
    }

    // Delete existing salary rates for this machine type
    await prisma.machineTypeSalary.deleteMany({
      where: { machineType: machine.machineType },
    })

    // Create new salary rates
    const salaryData = []
    for (const rate of salaryRates) {
      // Find or create designation
      let designation = await prisma.designation.findUnique({
        where: { name: rate.designation },
      })

      if (!designation) {
        designation = await prisma.designation.create({
          data: {
            name: rate.designation,
            isVariablePay: ["operator", "karigar", "helper"].includes(rate.designation),
            slug: rate.designation.toLowerCase().replace(/\s+/g, "-"),
          },
        })
      }

      salaryData.push({
        machineType: machine.machineType,
        designationId: designation.id,
        monthlySalary: rate.dailyRate * 30, // Convert daily to monthly
      })
    }

    if (salaryData.length > 0) {
      await prisma.machineTypeSalary.createMany({
        data: salaryData,
      })
    }

    return salaryData
  } catch (error) {
    console.error("Error updating machine salary rates:", error)
    throw error
  }
}

export async function getMachineBonusRates(machineId: string) {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    })

    if (!machine) {
      return []
    }

    const bonusRates = await prisma.machineTypeBonusTier.findMany({
      where: { machineType: machine.machineType },
      orderBy: { minStitches: "asc" },
    })

    return bonusRates
  } catch (error) {
    console.error("Error fetching machine bonus rates:", error)
    throw error
  }
}

export async function getMachineSalaryRates(machineId: string) {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    })

    if (!machine) {
      return []
    }

    const salaryRates = await prisma.machineTypeSalary.findMany({
      where: { machineType: machine.machineType },
      include: {
        designation: true,
      },
      orderBy: {
        designation: {
          name: "asc",
        },
      },
    })

    return salaryRates
  } catch (error) {
    console.error("Error fetching machine salary rates:", error)
    throw error
  }
}

export function calculateBonusAmount(
  stitchCount: number,
  bonusType: "TWO_HEAD" | "SHEET",
  bonusRates: { minStitches: number; rateTwoHead: number; rateSheet: number }[],
): number {
  // Find the appropriate rate for the given stitch count
  const applicableRates = bonusRates
    .filter((rate) => rate.minStitches <= stitchCount)
    .sort((a, b) => b.minStitches - a.minStitches) // Sort by minStitches descending

  if (applicableRates.length === 0) {
    return 0
  }

  const rate = bonusType === "TWO_HEAD" ? applicableRates[0].rateTwoHead : applicableRates[0].rateSheet

  // Calculate bonus (assuming rate is per 1000 stitches)
  return (stitchCount / 1000) * rate
}

export async function getMachineRates(machineId: string) {
  try {
    const [bonusRates, salaryRates] = await Promise.all([
      getMachineBonusRates(machineId),
      getMachineSalaryRates(machineId),
    ])

    return {
      bonusRates,
      salaryRates,
    }
  } catch (error) {
    console.error("Error fetching machine rates:", error)
    throw error
  }
}
