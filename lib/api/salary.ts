import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type SalaryRecord = Database["public"]["Tables"]["salary_records"]["Row"]
type SalaryRecordInsert = Database["public"]["Tables"]["salary_records"]["Insert"]

export async function createSalaryRecord(salaryRecord: SalaryRecordInsert) {
  const supabase = createClient()

  const { data, error } = await supabase.from("salary_records").insert(salaryRecord).select().single()

  if (error) throw error
  return data
}

export async function getSalaryRecords(employeeId?: string, month?: number, year?: number) {
  const supabase = createClient()

  let query = supabase.from("salary_records").select(`
      *,
      employees(emp_id, name, employee_types(name))
    `)

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }
  if (month) {
    query = query.eq("month", month)
  }
  if (year) {
    query = query.eq("year", year)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function updateSalaryRecord(id: string, updates: Partial<SalaryRecord>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("salary_records").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export async function deleteSalaryRecord(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("salary_records").delete().eq("id", id)

  if (error) throw error
}

export async function calculateMonthlySalary(
  employeeId: string,
  month: number,
  year: number,
  workingDays: number,
  fridayDays = 0,
  normalLeaves = 0,
  fridayLeaves = 0,
  holidays = 0,
) {
  const supabase = createClient()

  // Get employee details
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(`
      *,
      employee_types(has_fixed_salary)
    `)
    .eq("id", employeeId)
    .single()

  if (employeeError) throw employeeError
  if (!employee.salary || !employee.employee_types?.has_fixed_salary) {
    throw new Error("Employee does not have fixed salary")
  }

  // Calculate salary components
  const dailyRate = employee.salary / 30 // Assuming 30 days per month
  const fridayMultiplier = 2.5

  const normalDaysSalary = (workingDays - fridayDays) * dailyRate
  const fridaysSalary = fridayDays * dailyRate * fridayMultiplier
  const holidaysSalary = holidays * dailyRate * fridayMultiplier
  const normalLeavesDeduction = normalLeaves * dailyRate
  const fridayLeavesDeduction = fridayLeaves * dailyRate * fridayMultiplier

  const totalSalary = normalDaysSalary + fridaysSalary + holidaysSalary - normalLeavesDeduction - fridayLeavesDeduction

  // Get advance deductions for the month
  const { data: advances } = await supabase
    .from("employee_advances")
    .select("amount")
    .eq("employee_id", employeeId)
    .gte("date", `${year}-${month.toString().padStart(2, "0")}-01`)
    .lt("date", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)

  const advanceDeduction = advances?.reduce((sum, advance) => sum + advance.amount, 0) || 0
  const finalSalary = totalSalary - advanceDeduction

  return {
    base_salary: employee.salary,
    working_days: workingDays,
    friday_days: fridayDays,
    normal_leaves: normalLeaves,
    friday_leaves: fridayLeaves,
    holidays: holidays,
    total_salary: totalSalary,
    advance_deduction: advanceDeduction,
    bonus: 0,
    final_salary: finalSalary,
  }
}
