// lib/utils/sallery.ts
import { FRIDAY_MULTIPLIER } from "../constants"

/**
 * Days in a month (month: 1-12)
 */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Count Fridays in a given month (month: 1-12)
 */
export function getFridaysInMonth(month: number, year: number): number {
  const daysInMonth = getDaysInMonth(month, year)
  let fridayCount = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() === 5) fridayCount++
  }

  return fridayCount
}

/**
 * Daily rates for the selected month/year.
 * - normalDay = monthly / daysInMonth
 * - fridayDay = normalDay * FRIDAY_MULTIPLIER
 */
export function calculateDailySalary(
  monthlySalary: number,
  month: number,
  year: number,
): { normalDay: number; fridayDay: number } {
  const totalDays = getDaysInMonth(month, year)
  const normalDay = Number(monthlySalary) / totalDays
  return {
    normalDay,
    fridayDay: normalDay * FRIDAY_MULTIPLIER,
  }
}

/**
 * Calculate the total payable salary for a fixed-salary employee.
 *
 * Rules implemented:
 * - Per-day = monthly / daysInMonth
 * - Fridays pay FRIDAY_MULTIPLIER × per-day
 * - Holidays pay FRIDAY_MULTIPLIER × per-day **and** replace a normal day
 * - Normal leaves remove 1× per-day each
 * - Friday leaves remove FRIDAY_MULTIPLIER × per-day each
 * - bonus added, advance subtracted
 *
 * All counts should be >= 0. We clamp interim values to avoid negatives.
 */
export function calculateMonthlySalary(
  monthlySalary: number,
  month: number,
  year: number,
  workingDays: number,
  fridayDays = 0,
  normalLeaves = 0,
  fridayLeaves = 0,
  holidays = 0,
  bonus = 0,
  advance = 0,
): number {
  const { normalDay, fridayDay } = calculateDailySalary(monthlySalary, month, year)

  // Base normal working days (those that are not Fridays)
  const baseNormalDays = Math.max(0, workingDays - fridayDays)

  // Remove normal leaves and holidays (a holiday replaces a normal day)
  const paidNormalDays = Math.max(0, baseNormalDays - normalLeaves - holidays)

  // Fridays worked minus Friday leaves
  const paidFridays = Math.max(0, fridayDays - fridayLeaves)

  // Holiday pay (each holiday is paid like a Friday)
  const holidayPay = Math.max(0, holidays) * fridayDay

  const total =
    paidNormalDays * normalDay +
    paidFridays * fridayDay +
    holidayPay +
    Number(bonus || 0) -
    Number(advance || 0)

  // Never pay negative
  return Math.max(0, Math.round(total))
}

/**
 * EMP code helper (EMP1, EMP2, ...)
 */
export function generateEmpId(lastEmpNumber: number): string {
  return `EMP${lastEmpNumber + 1}`
}
