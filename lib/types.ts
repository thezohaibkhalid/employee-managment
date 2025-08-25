import type { MachineType, BonusType, Gender, PayslipItemType } from "@prisma/client"

export type { MachineType, BonusType, Gender, PayslipItemType }

export interface Machine {
  id: string
  name: string
  company: {
    id: string
    name: string
  }
  machineType: MachineType
  createdAt: Date
  updatedAt: Date
}

export interface BonusRate {
  id: string
  machineType: MachineType
  minStitches: number
  maxStitches: number | null
  rateTwoHead: number
  rateSheet: number
  createdAt: Date
}

export interface SalaryRate {
  id: string
  machineType: MachineType
  designation: {
    id: string
    name: string
    isVariablePay: boolean
  }
  monthlySalary: number
  createdAt: Date
}

export interface Designation {
  id: string
  name: string
  isVariablePay: boolean
  slug: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Employee {
  id: string
  empNumber: number
  empCode: string // EMP1, EMP2, etc.
  name: string
  fatherName: string | null
  dob: Date | null
  cnic: string | null
  phone: string | null
  address: string | null
  city: string | null
  caste: string | null
  gender: Gender
  bloodGroup: string | null
  designation: Designation
  fixedMonthlySalary: number | null // for fixed salary employees
  referenceName: string | null
  referencePhone: string | null
  referenceRelation: string | null
  contactPersonName: string | null
  contactPersonNumber: string | null
  contactPersonRelation: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeAdvance {
  id: string
  employeeId: string
  amount: number
  takenOn: Date
  note: string | null
}

// Form types for UI
export interface MachineFormData {
  name: string
  company: string
  type: MachineType
}

export interface EmployeeFormData {
  name: string
  fatherName: string
  dob: string
  cnic: string
  phone: string
  address: string
  designationId: string
  fixedMonthlySalary?: number
  caste: string
  city: string
  gender: Gender
  bloodGroup: string
  referenceName?: string
  referencePhone?: string
  referenceRelation?: string
  contactPersonName?: string
  contactPersonNumber?: string
  contactPersonRelation?: string
}

export interface BonusUploadData {
  stitch?: number
  "2 head"?: number
  sheet?: number
  bonusRates?: Array<{
    stitchCount: number
    bonusType: "stitch" | "2 head" | "sheet"
    rate: number
  }>
}

export interface SalaryUploadData {
  operator?: number
  karigar?: number
  helper?: number
  salaryRates?: Array<{
    designation: "operator" | "karigar" | "helper"
    dailyRate: number
  }>
}
