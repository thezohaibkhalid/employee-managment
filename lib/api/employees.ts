import { prisma } from "@/lib/prisma"
import type { Gender } from "@prisma/client"

export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        designation: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return employees
  } catch (error) {
    console.error("Error fetching employees:", error)
    throw error
  }
}

export async function getEmployee(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        designation: true,
        advances: {
          orderBy: { takenOn: "desc" },
        },
        payslips: {
          include: {
            period: true,
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    return employee
  } catch (error) {
    console.error("Error fetching employee:", error)
    throw error
  }
}

export async function createEmployee(data: {
  name: string
  fatherName?: string
  dob?: string
  cnic?: string
  phone?: string
  address?: string
  designationId: string
  fixedMonthlySalary?: number
  caste?: string
  city?: string
  gender?: Gender
  bloodGroup?: string
  referenceName?: string
  referencePhone?: string
  referenceRelation?: string
  contactPersonName?: string
  contactPersonNumber?: string
  contactPersonRelation?: string
}) {
  try {
    // Get the next employee number
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { empNumber: "desc" },
    })

    const nextEmpNumber = (lastEmployee?.empNumber || 0) + 1
    const empCode = `EMP${nextEmpNumber}`

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        fatherName: data.fatherName,
        dob: data.dob ? new Date(data.dob) : null,
        cnic: data.cnic,
        phone: data.phone,
        address: data.address,
        designationId: data.designationId,
        fixedMonthlySalary: data.fixedMonthlySalary,
        caste: data.caste,
        city: data.city,
        gender: data.gender || "UNSPECIFIED",
        bloodGroup: data.bloodGroup,
        referenceName: data.referenceName,
        referencePhone: data.referencePhone,
        referenceRelation: data.referenceRelation,
        contactPersonName: data.contactPersonName,
        contactPersonNumber: data.contactPersonNumber,
        contactPersonRelation: data.contactPersonRelation,
        empCode: empCode,
      },
      include: {
        designation: true,
      },
    })

    return employee
  } catch (error) {
    console.error("Error creating employee:", error)
    throw error
  }
}

export async function updateEmployee(
  id: string,
  data: {
    name?: string
    fatherName?: string
    dob?: string
    cnic?: string
    phone?: string
    address?: string
    designationId?: string
    fixedMonthlySalary?: number
    caste?: string
    city?: string
    gender?: Gender
    bloodGroup?: string
    referenceName?: string
    referencePhone?: string
    referenceRelation?: string
    contactPersonName?: string
    contactPersonNumber?: string
    contactPersonRelation?: string
  },
) {
  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.fatherName !== undefined && { fatherName: data.fatherName }),
        ...(data.dob && { dob: new Date(data.dob) }),
        ...(data.cnic !== undefined && { cnic: data.cnic }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.designationId && { designationId: data.designationId }),
        ...(data.fixedMonthlySalary !== undefined && { fixedMonthlySalary: data.fixedMonthlySalary }),
        ...(data.caste !== undefined && { caste: data.caste }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.gender && { gender: data.gender }),
        ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
        ...(data.referenceName !== undefined && { referenceName: data.referenceName }),
        ...(data.referencePhone !== undefined && { referencePhone: data.referencePhone }),
        ...(data.referenceRelation !== undefined && { referenceRelation: data.referenceRelation }),
        ...(data.contactPersonName !== undefined && { contactPersonName: data.contactPersonName }),
        ...(data.contactPersonNumber !== undefined && { contactPersonNumber: data.contactPersonNumber }),
        ...(data.contactPersonRelation !== undefined && { contactPersonRelation: data.contactPersonRelation }),
      },
      include: {
        designation: true,
      },
    })

    return employee
  } catch (error) {
    console.error("Error updating employee:", error)
    throw error
  }
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    throw error
  }
}

export async function addEmployeeAdvance(data: {
  employeeId: string
  amount: number
  note?: string
}) {
  try {
    const advance = await prisma.employeeAdvance.create({
      data: {
        employeeId: data.employeeId,
        amount: data.amount,
        note: data.note,
      },
    })
    return advance
  } catch (error) {
    console.error("Error adding employee advance:", error)
    throw error
  }
}

export async function getEmployeeAdvances(employeeId: string) {
  try {
    const advances = await prisma.employeeAdvance.findMany({
      where: { employeeId },
      orderBy: { takenOn: "desc" },
    })
    return advances
  } catch (error) {
    console.error("Error fetching employee advances:", error)
    throw error
  }
}

export async function getEmployeesByDesignation(designationNames: string[]) {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        designation: {
          name: {
            in: designationNames,
          },
        },
      },
      include: {
        designation: true,
      },
    })
    return employees
  } catch (error) {
    console.error("Error fetching employees by designation:", error)
    throw error
  }
}
