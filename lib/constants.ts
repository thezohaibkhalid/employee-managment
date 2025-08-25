import type { MachineType, Gender } from "@prisma/client"

export const MACHINE_TYPES: MachineType[] = ["H17", "H18", "H28", "H33", "H34"]

export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  H17: "17 head",
  H18: "18 head",
  H28: "28 head",
  H33: "33 head",
  H34: "34 head",
}

export const BONUS_TYPES = ["TWO_HEAD", "SHEET"] as const

export const WORKER_DESIGNATIONS = ["operator", "karigar", "helper"] as const

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "UNSPECIFIED", label: "Prefer not to say" },
]

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export const FRIDAY_MULTIPLIER = 2.5

export const DEFAULT_DESIGNATIONS = [
  { name: "operator", isVariablePay: true },
  { name: "karigar", isVariablePay: true },
  { name: "helper", isVariablePay: true },
  { name: "supervisor", isVariablePay: false },
  { name: "manager", isVariablePay: false },
]
