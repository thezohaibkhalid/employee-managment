import { prisma } from "@/lib/prisma"

export async function getDesignations() {
  try {
    const designations = await prisma.designation.findMany({
      orderBy: { name: "asc" },
    })
    return designations
  } catch (error) {
    console.error("Error fetching designations:", error)
    throw error
  }
}

export async function getDesignation(id: string) {
  try {
    const designation = await prisma.designation.findUnique({
      where: { id },
    })
    return designation
  } catch (error) {
    console.error("Error fetching designation:", error)
    throw error
  }
}

export async function createDesignation(data: {
  name: string
  isVariablePay: boolean
  notes?: string
}) {
  try {
    const slug = data.name.toLowerCase().replace(/\s+/g, "-")

    const designation = await prisma.designation.create({
      data: {
        name: data.name,
        isVariablePay: data.isVariablePay,
        slug: slug,
        notes: data.notes,
      },
    })
    return designation
  } catch (error) {
    console.error("Error creating designation:", error)
    throw error
  }
}

export async function updateDesignation(
  id: string,
  data: {
    name?: string
    isVariablePay?: boolean
    notes?: string
  },
) {
  try {
    const updateData: any = {}

    if (data.name) {
      updateData.name = data.name
      updateData.slug = data.name.toLowerCase().replace(/\s+/g, "-")
    }
    if (data.isVariablePay !== undefined) {
      updateData.isVariablePay = data.isVariablePay
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    const designation = await prisma.designation.update({
      where: { id },
      data: updateData,
    })
    return designation
  } catch (error) {
    console.error("Error updating designation:", error)
    throw error
  }
}

export async function deleteDesignation(id: string) {
  try {
    // Check if designation is being used by any employees
    const employeeCount = await prisma.employee.count({
      where: { designationId: id },
    })

    if (employeeCount > 0) {
      throw new Error("Cannot delete designation that is in use by employees")
    }

    // Check if it's a core designation (operator, karigar, helper)
    const designation = await prisma.designation.findUnique({
      where: { id },
    })

    const coreDesignations = ["operator", "karigar", "helper"]
    if (designation && coreDesignations.includes(designation.name.toLowerCase())) {
      throw new Error("Cannot delete core designations")
    }

    await prisma.designation.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting designation:", error)
    throw error
  }
}
