export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      employee_types: {
        Row: {
          id: string
          name: string
          has_fixed_salary: boolean
          description: string | null
          is_core_type: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          has_fixed_salary?: boolean
          description?: string | null
          is_core_type?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          has_fixed_salary?: boolean
          description?: string | null
          is_core_type?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          name: string
          company: string
          machine_type: "17 head" | "18 head" | "28 head" | "33 head" | "34 head"
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          machine_type: "17 head" | "18 head" | "28 head" | "33 head" | "34 head"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          machine_type?: "17 head" | "18 head" | "28 head" | "33 head" | "34 head"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      machine_bonus_rates: {
        Row: {
          id: string
          machine_id: string
          bonus_type: "stitch" | "2 head" | "sheet"
          stitch_count: number
          rate: number
          created_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          bonus_type: "stitch" | "2 head" | "sheet"
          stitch_count?: number
          rate: number
          created_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          bonus_type?: "stitch" | "2 head" | "sheet"
          stitch_count?: number
          rate?: number
          created_at?: string
        }
      }
      machine_salary_rates: {
        Row: {
          id: string
          machine_id: string
          employee_type: string
          daily_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          employee_type: string
          daily_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          employee_type?: string
          daily_rate?: number
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          emp_id: string
          name: string
          father_name: string
          date_of_birth: string
          cnic: string
          phone: string
          address: string
          designation_id: string
          salary: number | null
          caste: string | null
          city: string
          gender: "male" | "female" | "other"
          blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null
          reference_name: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contact_person_relation: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          emp_id?: string
          name: string
          father_name: string
          date_of_birth: string
          cnic: string
          phone: string
          address: string
          designation_id: string
          salary?: number | null
          caste?: string | null
          city: string
          gender: "male" | "female" | "other"
          blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null
          reference_name?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_relation?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          emp_id?: string
          name?: string
          father_name?: string
          date_of_birth?: string
          cnic?: string
          phone?: string
          address?: string
          designation_id?: string
          salary?: number | null
          caste?: string | null
          city?: string
          gender?: "male" | "female" | "other"
          blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null
          reference_name?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_relation?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      advances: {
        Row: {
          id: string
          employee_id: string
          amount: number
          description: string | null
          date_given: string
          is_deducted: boolean
          deducted_from_salary_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          amount: number
          description?: string | null
          date_given?: string
          is_deducted?: boolean
          deducted_from_salary_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          amount?: number
          description?: string | null
          date_given?: string
          is_deducted?: boolean
          deducted_from_salary_id?: string | null
          created_at?: string
        }
      }
      salary_records: {
        Row: {
          id: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          working_days: number
          friday_days: number
          normal_leaves: number
          friday_leaves: number
          holidays: number
          bonus: number
          advance_deducted: number
          total_salary: number
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          working_days: number
          friday_days?: number
          normal_leaves?: number
          friday_leaves?: number
          holidays?: number
          bonus?: number
          advance_deducted?: number
          total_salary: number
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          month?: number
          year?: number
          base_salary?: number
          working_days?: number
          friday_days?: number
          normal_leaves?: number
          friday_leaves?: number
          holidays?: number
          bonus?: number
          advance_deducted?: number
          total_salary?: number
          created_at?: string
        }
      }
      production_records: {
        Row: {
          id: string
          machine_id: string
          date: string
          day_type: "normal" | "friday" | "holiday"
          bonus_type: "stitch" | "2 head" | "sheet"
          stitches: number
          bonus_amount: number
          operator_id: string | null
          karigar_id: string | null
          helper_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          date: string
          day_type?: "normal" | "friday" | "holiday"
          bonus_type: "stitch" | "2 head" | "sheet"
          stitches: number
          bonus_amount: number
          operator_id?: string | null
          karigar_id?: string | null
          helper_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          date?: string
          day_type?: "normal" | "friday" | "holiday"
          bonus_type?: "stitch" | "2 head" | "sheet"
          stitches?: number
          bonus_amount?: number
          operator_id?: string | null
          karigar_id?: string | null
          helper_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      machine_type_enum: "17 head" | "18 head" | "28 head" | "33 head" | "34 head"
      bonus_type_enum: "stitch" | "2 head" | "sheet"
      gender_enum: "male" | "female" | "other"
      blood_group_enum: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      day_type_enum: "normal" | "friday" | "holiday"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
