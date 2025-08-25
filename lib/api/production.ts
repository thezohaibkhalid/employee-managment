import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type ProductionRecord = Database["public"]["Tables"]["production_records"]["Row"]
type ProductionRecordInsert = Database["public"]["Tables"]["production_records"]["Insert"]

export async function createProductionRecord(record: ProductionRecordInsert) {
  const supabase = createClient()

  const { data, error } = await supabase.from("production_records").insert(record).select().single()

  if (error) throw error
  return data
}

export async function getProductionRecords(machineId?: string, month?: number, year?: number) {
  const supabase = createClient()

  let query = supabase.from("production_records").select(`
      *,
      machines(name, machine_type),
      operator:employees!production_records_operator_id_fkey(emp_id, name),
      karigar:employees!production_records_karigar_id_fkey(emp_id, name),
      helper:employees!production_records_helper_id_fkey(emp_id, name)
    `)

  if (machineId) {
    query = query.eq("machine_id", machineId)
  }
  if (month && year) {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
    const endDate = `${year}-${(month + 1).toString().padStart(2, "0")}-01`
    query = query.gte("date", startDate).lt("date", endDate)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error) throw error
  return data
}

export async function updateProductionRecord(id: string, updates: Partial<ProductionRecord>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("production_records").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export async function deleteProductionRecord(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("production_records").delete().eq("id", id)

  if (error) throw error
}

export async function calculateProductionSalary(
  machineId: string,
  date: string,
  operatorId: string | null,
  karigarId: string | null,
  helperId: string | null,
  bonusType: string,
  stitches: number,
) {
  const supabase = createClient()

  // Get machine details with rates
  const { data: machine, error: machineError } = await supabase
    .from("machines")
    .select(`
      *,
      machine_bonus_rates(*),
      machine_salary_rates(*)
    `)
    .eq("id", machineId)
    .single()

  if (machineError) throw machineError

  // Get bonus rate for the bonus type and stitch count
  const bonusRates = machine.machine_bonus_rates
    ?.filter((rate) => rate.bonus_type.toLowerCase() === bonusType.toLowerCase())
    .sort((a, b) => a.stitch_count - b.stitch_count)

  if (!bonusRates || bonusRates.length === 0) {
    throw new Error("Bonus rate not found for this bonus type")
  }

  // Find the appropriate rate based on stitch count
  let applicableRate = bonusRates[0]
  for (const rate of bonusRates) {
    if (stitches >= rate.stitch_count) {
      applicableRate = rate
    } else {
      break
    }
  }

  // Calculate bonus amount
  const bonusAmount = stitches * applicableRate.rate

  // Get salary rates for each employee type
  const operatorRate = machine.machine_salary_rates?.find((rate) => rate.employee_type === "operator")?.daily_rate || 0
  const karigarRate = machine.machine_salary_rates?.find((rate) => rate.employee_type === "karigar")?.daily_rate || 0
  const helperRate = machine.machine_salary_rates?.find((rate) => rate.employee_type === "helper")?.daily_rate || 0

  // Check if it's Friday (multiply by 2.5)
  const dateObj = new Date(date)
  const isFriday = dateObj.getDay() === 5
  const multiplier = isFriday ? 2.5 : 1

  const operatorSalary = operatorId ? operatorRate * multiplier : 0
  const karigarSalary = karigarId ? karigarRate * multiplier : 0
  const helperSalary = helperId ? helperRate * multiplier : 0

  return {
    bonus_amount: bonusAmount,
    operator_salary: operatorSalary,
    karigar_salary: karigarSalary,
    helper_salary: helperSalary,
  }
}

export async function generateMonthlyProductionSummary(machineId: string, month: number, year: number) {
  const supabase = createClient()

  // Get all production records for the month
  const { data: records, error } = await supabase
    .from("production_records")
    .select("*")
    .eq("machine_id", machineId)
    .gte("date", `${year}-${month.toString().padStart(2, "0")}-01`)
    .lt("date", `${year}-${(month + 1).toString().padStart(2, "0")}-01`)

  if (error) throw error

  // Group by employee and calculate totals
  const employeeSummary = new Map()

  records?.forEach((record) => {
    // Process operator
    if (record.operator_id) {
      const key = record.operator_id
      if (!employeeSummary.has(key)) {
        employeeSummary.set(key, {
          employee_id: record.operator_id,
          total_salary: 0,
          total_bonus: 0,
          working_days: 0,
        })
      }
      const summary = employeeSummary.get(key)
      summary.total_salary += record.operator_salary
      summary.total_bonus += record.bonus_amount / 2 // Split bonus between operator and karigar
      summary.working_days += 1
    }

    // Process karigar
    if (record.karigar_id) {
      const key = record.karigar_id
      if (!employeeSummary.has(key)) {
        employeeSummary.set(key, {
          employee_id: record.karigar_id,
          total_salary: 0,
          total_bonus: 0,
          working_days: 0,
        })
      }
      const summary = employeeSummary.get(key)
      summary.total_salary += record.karigar_salary
      summary.total_bonus += record.bonus_amount / 2 // Split bonus between operator and karigar
      summary.working_days += 1
    }

    // Process helper
    if (record.helper_id) {
      const key = record.helper_id
      if (!employeeSummary.has(key)) {
        employeeSummary.set(key, {
          employee_id: record.helper_id,
          total_salary: 0,
          total_bonus: 0,
          working_days: 0,
        })
      }
      const summary = employeeSummary.get(key)
      summary.total_salary += record.helper_salary
      summary.working_days += 1
    }
  })

  // Save summaries to database
  const summaries = Array.from(employeeSummary.values()).map((summary) => ({
    machine_id: machineId,
    employee_id: summary.employee_id,
    month,
    year,
    total_salary: summary.total_salary,
    total_bonus: summary.total_bonus,
    final_amount: summary.total_salary + summary.total_bonus,
    working_days: summary.working_days,
  }))

  // Delete existing summaries for this month
  await supabase
    .from("monthly_production_summary")
    .delete()
    .eq("machine_id", machineId)
    .eq("month", month)
    .eq("year", year)

  // Insert new summaries
  if (summaries.length > 0) {
    const { data, error: insertError } = await supabase.from("monthly_production_summary").insert(summaries).select()

    if (insertError) throw insertError
    return data
  }

  return []
}
