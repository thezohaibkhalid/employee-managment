import { FRIDAY_MULTIPLIER } from "../constants"

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function getFridaysInMonth(month: number, year: number): number {
  const daysInMonth = getDaysInMonth(month, year)
  let fridayCount = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() === 5) {
      // Friday is day 5
      fridayCount++
    }
  }

  return fridayCount
}

export function calculateDailySalary(
  monthlySalary: number,
  month: number,
  year: number,
): { normalDay: number; fridayDay: number } {
  const totalDays = getDaysInMonth(month, year)
  const fridayDays = getFridaysInMonth(month, year)
  const normalDays = totalDays - fridayDays

  // Calculate base daily rate considering Friday multiplier
  const totalMultipliedDays = normalDays + fridayDays * FRIDAY_MULTIPLIER
  const baseDailyRate = monthlySalary / totalMultipliedDays

  return {
    normalDay: baseDailyRate,
    fridayDay: baseDailyRate * FRIDAY_MULTIPLIER,
  }
}

export function calculateMonthlySalary(
  baseSalary: number,
  workingDays: number,
  fridayDays: number,
  normalLeaves: number,
  fridayLeaves: number,
  holidays: number,
  bonus = 0,
  advance = 0,
): number {
  const normalWorkDays = workingDays - fridayDays
  const holidaySalary = holidays * baseSalary * FRIDAY_MULTIPLIER

  const totalSalary =
    normalWorkDays * baseSalary + fridayDays * baseSalary * FRIDAY_MULTIPLIER + holidaySalary + bonus - advance

  return Math.max(0, totalSalary)
}

export function generateEmpId(lastEmpNumber: number): string {
  return `EMP${lastEmpNumber + 1}`
}
