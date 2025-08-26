import { prisma } from "@/lib/prisma";

/**
 * Calculate monthly salary for a FIXED-salary employee.
 * Uses:
 *  - Employee.fixedMonthlySalary (must exist)
 *  - Employee.designation.isVariablePay (must be false)
 *  - AppSetting.fridayMultiplier (fallback 2.5)
 *  - EmployeeAdvance within the month for deductions
 */
export async function calculateMonthlySalary(
  employeeId: string,
  month: number,       // 1..12
  year: number,
  workingDays: number,
  fridayDays = 0,
  normalLeaves = 0,
  fridayLeaves = 0,
  holidays = 0
) {
  // Load employee & ensure they’re fixed-salary (non-variable pay)
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { designation: true },
  });
  if (!employee) throw new Error("Employee not found");
  if (employee.designation.isVariablePay || !employee.fixedMonthlySalary) {
    throw new Error("Employee does not have fixed salary");
  }

  // Friday multiplier from settings (fallback to 2.5)
  const settings = await prisma.appSetting.findFirst();
  const fridayMultiplier = settings?.fridayMultiplier ?? 2.5;

  // Coerce & sanity
  const wd = Math.max(0, Number(workingDays));
  const fd = Math.max(0, Number(fridayDays));
  const nl = Math.max(0, Number(normalLeaves));
  const fl = Math.max(0, Number(fridayLeaves));
  const hol = Math.max(0, Number(holidays));

  // Core math (30-day month convention)
  const baseMonthly = Number(employee.fixedMonthlySalary);
  const dailyRate = baseMonthly / 30;

  const normalDays = Math.max(0, wd - fd);
  const normalDaysSalary = normalDays * dailyRate;
  const fridaysSalary = fd * dailyRate * fridayMultiplier;
  const holidaysSalary = hol * dailyRate * fridayMultiplier;
  const normalLeavesDeduction = nl * dailyRate;
  const fridayLeavesDeduction = fl * dailyRate * fridayMultiplier;

  const totalSalary =
    normalDaysSalary +
    fridaysSalary +
    holidaysSalary -
    normalLeavesDeduction -
    fridayLeavesDeduction;

  // Month boundaries for advances (inclusive start, exclusive next-month start)
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);

  const advances = await prisma.employeeAdvance.findMany({
    where: {
      employeeId,
      takenOn: { gte: periodStart, lt: periodEnd },
    },
    select: { amount: true },
  });

  const advanceDeduction = advances.reduce((sum, a) => sum + Number(a.amount), 0);
  const finalSalary = totalSalary - advanceDeduction;

  // Return plain numbers for the API response
  return {
    base_salary: Number(baseMonthly.toFixed(2)),
    working_days: wd,
    friday_days: fd,
    normal_leaves: nl,
    friday_leaves: fl,
    holidays: hol,
    total_salary: Number(totalSalary.toFixed(2)),
    advance_deduction: Number(advanceDeduction.toFixed(2)),
    bonus: 0,
    final_salary: Number(finalSalary.toFixed(2)),
  };
}
