import { prisma } from "../prisma"

// Create or get payroll period
export async function getOrCreatePayrollPeriod(year: number, month: number) {
  let period = await prisma.payrollPeriod.findUnique({
    where: { year_month: { year, month } },
  })

  if (!period) {
    period = await prisma.payrollPeriod.create({
      data: { year, month },
    })
  }

  return period
}

// Create payroll run for a machine and period
export async function createPayrollRun(machineId: string, periodId: string, workDays: any[]) {
  const payrollRun = await prisma.payrollRun.create({
    data: {
      machineId,
      periodId,
      rateSnapshot: {}, // Store rates snapshot for audit
      workdays: {
        create: workDays.map((day) => ({
          date: day.date,
          weekday: day.date.getDay(),
          isFriday: day.day.toLowerCase() === "friday",
          bonusType: day.bonusType === "2 head" ? "TWO_HEAD" : "SHEET",
          stitches: day.stitches,
          rateUsed: day.rateUsed || {},
          bonusAmount: day.bonusAmount,
          employeeAId: day.employee1Id,
          employeeBId: day.employee2Id,
          salaryA: day.salaryA,
          salaryB: day.salaryB,
          note: day.note,
        })),
      },
    },
    include: {
      workdays: true,
      machine: {
        include: { company: true },
      },
      period: true,
    },
  })

  return payrollRun
}

// Generate payslips for employees in a payroll run
export async function generatePayslips(payrollRunId: string) {
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      workdays: {
        include: {
          employeeA: { include: { designation: true } },
          employeeB: { include: { designation: true } },
        },
      },
      period: true,
    },
  })

  if (!payrollRun) throw new Error("Payroll run not found")

  const employeeData = new Map()

  // Aggregate data by employee
  payrollRun.workdays.forEach((workday) => {
    if (workday.employeeAId && workday.salaryA) {
      const current = employeeData.get(workday.employeeAId) || {
        employeeId: workday.employeeAId,
        employee: workday.employeeA,
        totalSalary: 0,
        totalBonus: 0,
        workingDays: 0,
        items: [],
      }

      current.totalSalary += Number(workday.salaryA)
      current.totalBonus += Number(workday.bonusAmount) / 2 // Split bonus
      current.workingDays += 1
      current.items.push({
        kind: "SALARY",
        amount: workday.salaryA,
        description: `Salary for ${workday.date.toDateString()}`,
        workDayId: workday.id,
      })

      if (workday.bonusAmount > 0) {
        current.items.push({
          kind: "BONUS",
          amount: Number(workday.bonusAmount) / 2,
          description: `Bonus for ${workday.date.toDateString()}`,
          workDayId: workday.id,
        })
      }

      employeeData.set(workday.employeeAId, current)
    }

    if (workday.employeeBId && workday.salaryB) {
      const current = employeeData.get(workday.employeeBId) || {
        employeeId: workday.employeeBId,
        employee: workday.employeeB,
        totalSalary: 0,
        totalBonus: 0,
        workingDays: 0,
        items: [],
      }

      current.totalSalary += Number(workday.salaryB)
      current.totalBonus += Number(workday.bonusAmount) / 2 // Split bonus
      current.workingDays += 1
      current.items.push({
        kind: "SALARY",
        amount: workday.salaryB,
        description: `Salary for ${workday.date.toDateString()}`,
        workDayId: workday.id,
      })

      if (workday.bonusAmount > 0) {
        current.items.push({
          kind: "BONUS",
          amount: Number(workday.bonusAmount) / 2,
          description: `Bonus for ${workday.date.toDateString()}`,
          workDayId: workday.id,
        })
      }

      employeeData.set(workday.employeeBId, current)
    }
  })

  // Create payslips
  const payslips = []
  for (const [employeeId, data] of employeeData) {
    // Get employee advances for deduction
    const advances = await prisma.employeeAdvance.findMany({
      where: {
        employeeId,
        allocations: { none: {} }, // Not yet allocated
      },
      orderBy: { takenOn: "asc" },
    })

    let advancesDeducted = 0
    const allocations = []

    // Deduct advances up to net pay
    const grossPay = data.totalSalary + data.totalBonus
    for (const advance of advances) {
      if (advancesDeducted + Number(advance.amount) <= grossPay) {
        advancesDeducted += Number(advance.amount)
        allocations.push({
          advanceId: advance.id,
          amount: advance.amount,
        })
      } else {
        // Partial deduction
        const remaining = grossPay - advancesDeducted
        if (remaining > 0) {
          advancesDeducted += remaining
          allocations.push({
            advanceId: advance.id,
            amount: remaining,
          })
        }
        break
      }
    }

    const netPay = grossPay - advancesDeducted

    const payslip = await prisma.employeePayslip.create({
      data: {
        periodId: payrollRun.periodId,
        payrollRunId: payrollRun.id,
        employeeId,
        grossSalary: data.totalSalary,
        grossBonus: data.totalBonus,
        advancesDeducted,
        netPay,
        items: {
          create: data.items,
        },
        allocations: {
          create: allocations,
        },
      },
      include: {
        employee: { include: { designation: true } },
        items: true,
        allocations: { include: { advance: true } },
      },
    })

    payslips.push(payslip)
  }

  return payslips
}

// Get payroll runs with filters
export async function getPayrollRuns(filters?: {
  year?: number
  month?: number
  machineId?: string
}) {
  const where: any = {}

  if (filters?.machineId) {
    where.machineId = filters.machineId
  }

  if (filters?.year || filters?.month) {
    where.period = {}
    if (filters.year) where.period.year = filters.year
    if (filters.month) where.period.month = filters.month
  }

  return prisma.payrollRun.findMany({
    where,
    include: {
      machine: { include: { company: true } },
      period: true,
      payslips: {
        include: {
          employee: { include: { designation: true } },
        },
      },
      _count: {
        select: {
          workdays: true,
          payslips: true,
        },
      },
    },
    orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }, { createdAt: "desc" }],
  })
}

// Get payslips with filters
export async function getPayslips(filters?: {
  year?: number
  month?: number
  employeeId?: string
  payrollRunId?: string
}) {
  const where: any = {}

  if (filters?.employeeId) {
    where.employeeId = filters.employeeId
  }

  if (filters?.payrollRunId) {
    where.payrollRunId = filters.payrollRunId
  }

  if (filters?.year || filters?.month) {
    where.period = {}
    if (filters.year) where.period.year = filters.year
    if (filters.month) where.period.month = filters.month
  }

  return prisma.employeePayslip.findMany({
    where,
    include: {
      employee: { include: { designation: true } },
      period: true,
      payrollRun: {
        include: {
          machine: { include: { company: true } },
        },
      },
      items: true,
      allocations: { include: { advance: true } },
    },
    orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }, { createdAt: "desc" }],
  })
}

// Get payroll summary/reports
export async function getPayrollSummary(year: number, month: number) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { year_month: { year, month } },
    include: {
      runs: {
        include: {
          machine: { include: { company: true } },
          payslips: {
            include: {
              employee: { include: { designation: true } },
            },
          },
        },
      },
      payslips: {
        include: {
          employee: { include: { designation: true } },
        },
      },
    },
  })

  if (!period) return null

  const summary = {
    period: { year, month },
    totalRuns: period.runs.length,
    totalEmployees: period.payslips.length,
    totalGrossSalary: period.payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0),
    totalGrossBonus: period.payslips.reduce((sum, p) => sum + Number(p.grossBonus), 0),
    totalAdvancesDeducted: period.payslips.reduce((sum, p) => sum + Number(p.advancesDeducted), 0),
    totalNetPay: period.payslips.reduce((sum, p) => sum + Number(p.netPay), 0),
    byMachine: period.runs.map((run) => ({
      machine: run.machine,
      employeeCount: run.payslips.length,
      totalSalary: run.payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0),
      totalBonus: run.payslips.reduce((sum, p) => sum + Number(p.grossBonus), 0),
      totalNetPay: run.payslips.reduce((sum, p) => sum + Number(p.netPay), 0),
    })),
    byDesignation: {},
  }

  // Group by designation
  const designationMap = new Map()
  period.payslips.forEach((payslip) => {
    const designation = payslip.employee.designation.name
    const current = designationMap.get(designation) || {
      count: 0,
      totalSalary: 0,
      totalBonus: 0,
      totalNetPay: 0,
    }
    current.count += 1
    current.totalSalary += Number(payslip.grossSalary)
    current.totalBonus += Number(payslip.grossBonus)
    current.totalNetPay += Number(payslip.netPay)
    designationMap.set(designation, current)
  })

  summary.byDesignation = Object.fromEntries(designationMap)

  return summary
}
