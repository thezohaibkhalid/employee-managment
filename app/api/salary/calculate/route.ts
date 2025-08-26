import { prisma } from "@/lib/prisma";

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

export async function calculateMonthlySalary(
  employeeId: string,
  month: number,     // 1-12
  year: number,
  workingDays: number,
  fridayDays = 0,
  normalLeaves = 0,
  fridayLeaves = 0,
  holidays = 0,
  bonus = 0
) {
  // Load employee + friday multiplier (default 1.5)
  const [employee, setting] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeId },
      include: { designation: true },
    }),
    prisma.appSetting.findFirst(),
  ]);

  if (!employee) throw new Error("Employee not found");
  if (!employee.fixedMonthlySalary || employee.designation.isVariablePay) {
    throw new Error("Employee does not have fixed monthly salary");
  }

  const base = Number(employee.fixedMonthlySalary);
  const totalDays = daysInMonth(month, year);
  const perDay = base / totalDays;
  const fridayMult = Number(setting?.fridayMultiplier ?? 1.5);
  const fridayRate = perDay * fridayMult;

  // Leaves + holidays handling
  const baseNormalDays = Math.max(0, workingDays - fridayDays);
  const normalDaysAfterLeaves = Math.max(0, baseNormalDays - normalLeaves - holidays);
  const paidFridays = Math.max(0, fridayDays - fridayLeaves);
  const holidayPay = holidays * fridayRate;

  const normalPay = normalDaysAfterLeaves * perDay;
  const fridayPay = paidFridays * fridayRate;

  // Advances in month
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const advAgg = await prisma.employeeAdvance.aggregate({
    _sum: { amount: true },
    where: { employeeId, takenOn: { gte: start, lt: end } },
  });
  const advances = Number(advAgg._sum.amount ?? 0);

  const gross = normalPay + fridayPay + holidayPay + Number(bonus || 0);
  const finalSalary = Math.max(0, gross - advances);

  return {
    base_salary: base,
    working_days: workingDays,
    friday_days: fridayDays,
    normal_leaves: normalLeaves,
    friday_leaves: fridayLeaves,
    holidays,
    total_salary: Math.round(gross),
    advance_deduction: Math.round(advances),
    bonus: Number(bonus || 0),
    final_salary: Math.round(finalSalary),
    per_day: perDay,
    friday_rate: fridayRate,
    friday_multiplier: fridayMult,
  };
}
