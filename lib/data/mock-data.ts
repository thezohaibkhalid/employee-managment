import type { Machine, Employee, EmployeeType, BonusRate, SalaryRate } from "../types"

export const mockEmployeeTypes: EmployeeType[] = [
  {
    id: "1",
    name: "operator",
    hasFixedSalary: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "karigar",
    hasFixedSalary: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "helper",
    hasFixedSalary: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "supervisor",
    hasFixedSalary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockMachines: Machine[] = [
  {
    id: "1",
    name: "Machine Alpha",
    company: "Textile Corp",
    type: "17 head",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Machine Beta",
    company: "Industrial Ltd",
    type: "28 head",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockEmployees: Employee[] = [
  {
    id: "1",
    empId: "EMP1",
    name: "Ahmed Ali",
    fatherName: "Muhammad Ali",
    dob: new Date("1990-01-15"),
    cnic: "12345-6789012-3",
    phoneNumber: "0300-1234567",
    address: "123 Main Street, Karachi",
    designationId: "1",
    designation: mockEmployeeTypes[0],
    caste: "Punjabi", // Changed from 'cast' to 'caste'
    city: "Karachi",
    gender: "male",
    bloodGroup: "B+",
    reference: "Self",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockBonusRates: BonusRate[] = [
  {
    id: "1",
    machineId: "1",
    machineType: "17 head",
    bonusType: "stitch",
    rate: 0.5,
    createdAt: new Date(),
  },
  {
    id: "2",
    machineId: "1",
    machineType: "17 head",
    bonusType: "2 head",
    rate: 2.0,
    createdAt: new Date(),
  },
]

export const mockSalaryRates: SalaryRate[] = [
  {
    id: "1",
    machineId: "1",
    machineType: "17 head",
    designation: "operator",
    dailyRate: 1000,
    createdAt: new Date(),
  },
  {
    id: "2",
    machineId: "1",
    machineType: "17 head",
    designation: "karigar",
    dailyRate: 800,
    createdAt: new Date(),
  },
]
