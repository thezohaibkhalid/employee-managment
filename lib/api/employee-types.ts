import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type EmployeeType = Database["public"]["Tables"]["employee_types"]["Row"]
type EmployeeTypeInsert = Database["public"]["Tables"]["employee_types"]["Insert"]
type EmployeeTypeUpdate = Database["public"]["Tables"]["employee_types"]["Update"]

export async function getEmployeeTypes() {
  const supabase = createClient()

  const { data, error } = await supabase.from("employee_types").select("*").order("name")

  if (error) throw error
  return data
}

export async function getEmployeeType(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("employee_types").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createEmployeeType(employeeType: EmployeeTypeInsert) {
  const supabase = createClient()

  const { data, error } = await supabase.from("employee_types").insert(employeeType).select().single()

  if (error) throw error
  return data
}

export async function updateEmployeeType(id: string, employeeType: EmployeeTypeUpdate) {
  const supabase = createClient()

  const { data, error } = await supabase.from("employee_types").update(employeeType).eq("id", id).select().single()

  if (error) throw error
  return data
}

export async function deleteEmployeeType(id: string) {
  const supabase = createClient()

  // Check if employee type is core type
  const { data: employeeType } = await supabase.from("employee_types").select("is_core_type").eq("id", id).single()

  if (employeeType?.is_core_type) {
    throw new Error("Cannot delete core employee types")
  }

  // Check if any employees are using this type
  const { data: employees } = await supabase.from("employees").select("id").eq("employee_type_id", id).limit(1)

  if (employees && employees.length > 0) {
    throw new Error("Cannot delete employee type that is in use")
  }

  const { error } = await supabase.from("employee_types").delete().eq("id", id)

  if (error) throw error
}
