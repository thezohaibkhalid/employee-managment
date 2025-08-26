// lib/api/salary-records.ts
import { prisma } from "@/lib/prisma";
import { Prisma, PayslipItemType } from "@prisma/client";


function toRecord(p: any) {
  return {
    id: p.id,
    employee_id: p.employeeId,
    month: p.period?.month ?? null,
    year: p.period?.year ?? null,
    // We don't store working days explicitly in schema; default to 0 if unknown.
    working_days: p.workingDays ?? 0,
    friday_days: p.fridayDays ?? 0,
    normal_leaves: p.normalLeaves ?? 0,
    friday_leaves: p.fridayLeaves ?? 0,
    holidays: p.holidaysCount ?? 0,
    base_salary: p.baseSalary ?? Number((Number(p.grossSalary) + Number(p.advancesDeducted)).toFixed(2)), // best-effort
    total_salary: Number(p.grossSalary),
    advance_deduction: Number(p.advancesDeducted),
    bonus: Number(p.grossBonus ?? 0),
    final_salary: Number(p.netPay),
    created_at: p.createdAt ?? null,
    // For display helpers
    employee: p.employee
      ? {
          id: p.employee.id,
          name: p.employee.name,
          designation: p.employee.designation,
          empCode: p.employee.empCode,
        }
      : null,
  };
}

/** Ensure a PayrollPeriod exists and return it */
async function getOrCreatePeriod(year: number, month: number) {
  const found = await prisma.payrollPeriod.findUnique({
    where: { year_month: { year, month } },
  });
  if (found) return found;

  return prisma.payrollPeriod.create({ data: { year, month } });
}

/** GET salary records (reads from EmployeePayslip) */
export async function getSalaryRecords(
  employeeId?: string,
  month?: number,
  year?: number
) {
  // If month/year provided, filter via PayrollPeriod
  let periodId: string | undefined;
  if (month != null && year != null) {
    const period = await prisma.payrollPeriod.findUnique({
      where: { year_month: { year, month } },
      select: { id: true },
    });
    if (!period) {
      // No period created yet ⇒ no records
      return [];
    }
    periodId = period.id;
  }

  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  if (periodId) where.periodId = periodId;

  const rows = await prisma.employeePayslip.findMany({
    where,
    include: {
      employee: { include: { designation: true } },
      period: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toRecord);
}

/**
 * Create/update a fixed-salary payslip (one per employee/month).
 * Accepts both camelCase and snake_case keys from the client calculator.
 */
export async function createSalaryRecord(raw: any) {
  const employeeId = String(raw.employeeId ?? raw.employee_id);
  const month = Number(raw.month);
  const year = Number(raw.year);

  if (!employeeId || !month || !year) {
    throw new Error("employeeId, month, and year are required");
  }

  // Coerce numeric inputs
  const workingDays = Number(raw.workingDays ?? raw.working_days ?? 0);
  const fridayDays = Number(raw.fridayDays ?? raw.friday_days ?? 0);
  const normalLeaves = Number(raw.normalLeaves ?? raw.normal_leaves ?? 0);
  const fridayLeaves = Number(raw.fridayLeaves ?? raw.friday_leaves ?? 0);
  const holidays = Number(raw.holidays ?? 0);
  const baseSalary = Number(raw.base_salary ?? raw.baseSalary ?? 0);
  const totalSalary = Number(raw.total_salary ?? raw.totalSalary ?? 0);
  const advanceDeduction = Number(raw.advance_deduction ?? raw.advanceDeduction ?? 0);
  const bonus = Number(raw.bonus ?? 0);
  const finalSalary = Number(raw.final_salary ?? raw.finalSalary ?? totalSalary - advanceDeduction);

  // Ensure period exists
  const period = await getOrCreatePeriod(year, month);

  // Upsert (unique: periodId + employeeId)
  const payslip = await prisma.employeePayslip.upsert({
  where: {
    periodId_employeeId: { periodId: period.id, employeeId },
  },
  create: {
    periodId: period.id,
    employeeId,
    grossSalary: totalSalary,
    grossBonus: bonus,
    holidaysCount: holidays,
    fridayLeaves,
    normalLeaves,
    advancesDeducted: advanceDeduction,
    netPay: finalSalary,
    items: {
      create: [
        {
          kind: PayslipItemType.SALARY, // ⬅️ use enum
          amount: totalSalary,
          description: `Fixed salary ${month}/${year}`,
        },
        ...(bonus > 0
          ? [
              {
                kind: PayslipItemType.BONUS, // ⬅️ use enum
                amount: bonus,
                description: `Bonus ${month}/${year}`,
              },
            ]
          : []),
        ...(advanceDeduction > 0
          ? [
              {
                kind: PayslipItemType.ADVANCE_DEDUCTION, // ⬅️ use enum
                amount: advanceDeduction,
                description: `Advance deduction ${month}/${year}`,
              },
            ]
          : []),
      ] as Prisma.PayslipItemUncheckedCreateWithoutPayslipInput[], // (optional) helps TS
    },
  },
  update: {
    grossSalary: totalSalary,
    grossBonus: bonus,
    holidaysCount: holidays,
    fridayLeaves,
    normalLeaves,
    advancesDeducted: advanceDeduction,
    netPay: finalSalary,
  },
  include: {
    employee: { include: { designation: true } },
    period: true,
  },
});
  // Attach a couple of convenience fields for the mapper
  (payslip as any).workingDays = workingDays;
  (payslip as any).fridayDays = fridayDays;
  (payslip as any).baseSalary = baseSalary;

  return toRecord(payslip);
}


export async function updateSalaryRecord(id: string, raw: any) {
  // Map incoming fields (snake_case or camelCase) → Prisma columns
  const updateData: Prisma.EmployeePayslipUpdateInput = {};

  const n = (v: any) => (v == null || v === "" ? undefined : Number(v));

  const totalSalary = n(raw.total_salary ?? raw.totalSalary);
  const bonus = n(raw.bonus);
  const advanceDeduction = n(raw.advance_deduction ?? raw.advanceDeduction ?? raw.advance);
  const finalSalary = n(raw.final_salary ?? raw.finalSalary);

  const holidays = n(raw.holidays);
  const normalLeaves = n(raw.normal_leaves ?? raw.normalLeaves);
  const fridayLeaves = n(raw.friday_leaves ?? raw.fridayLeaves);

  if (totalSalary != null) updateData.grossSalary = totalSalary;
  if (bonus != null) updateData.grossBonus = bonus;
  if (advanceDeduction != null) updateData.advancesDeducted = advanceDeduction;
  if (finalSalary != null) updateData.netPay = finalSalary;

  if (holidays != null) updateData.holidaysCount = holidays;
  if (normalLeaves != null) updateData.normalLeaves = normalLeaves;
  if (fridayLeaves != null) updateData.fridayLeaves = fridayLeaves;

  // Update payslip
  const updated = await prisma.employeePayslip.update({
    where: { id },
    data: updateData,
    include: {
      employee: { include: { designation: true } },
      period: true,
    },
  });

  // Enrich for mapper with optional non-persisted fields (so UI can show them)
  (updated as any).workingDays =
    n(raw.working_days ?? raw.workingDays) ?? (updated as any).workingDays ?? 0;
  (updated as any).fridayDays =
    n(raw.friday_days ?? raw.fridayDays) ?? (updated as any).fridayDays ?? 0;
  (updated as any).baseSalary =
    n(raw.base_salary ?? raw.baseSalary) ?? (updated as any).baseSalary ?? 0;

  return toRecord(updated);
}

// --- DELETE (with children) ---
export async function deleteSalaryRecord(id: string) {
  // Remove dependent rows first to avoid FK errors
  await prisma.$transaction([
    prisma.advanceAllocation.deleteMany({ where: { payslipId: id } }),
    prisma.payslipItem.deleteMany({ where: { payslipId: id } }),
    prisma.employeePayslip.delete({ where: { id } }),
  ]);
}
