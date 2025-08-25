"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { PrimaryPopup } from "../ui/primary-popup"
import { EmployeeForm } from "./employee-form"
import { EmployeeProfile } from "./employee-profile"
import { Edit, Trash2, User, Search } from "lucide-react"
import type { Employee, EmployeeFormData, Designation } from "../../lib/types"

interface EmployeeListProps {
  employees: Employee[]
  designations: Designation[]
  onEdit: (id: string, data: EmployeeFormData) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function EmployeeList({ employees, designations, onEdit, onDelete, isLoading }: EmployeeListProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      onEdit(editingEmployee.id, data)
      setEditingEmployee(null)
    }
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No employees added yet. Add your first employee to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search employees by name, ID, or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{employee.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{employee.empCode}</p>
                </div>
                <Badge variant="secondary">{employee.designation.name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Phone:</span> {employee.phone || "N/A"}
                </p>
                <p>
                  <span className="font-medium">City:</span> {employee.city || "N/A"}
                </p>
                {employee.fixedMonthlySalary && (
                  <p>
                    <span className="font-medium">Salary:</span> Rs. {employee.fixedMonthlySalary.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setViewingEmployee(employee)}>
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Button>

                <Button variant="outline" size="sm" onClick={() => setEditingEmployee(employee)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>

                <Button variant="destructive" size="sm" onClick={() => onDelete(employee.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && searchTerm && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No employees found matching "{searchTerm}"</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Popup */}
      <PrimaryPopup
        trigger={<div />}
        title="Edit Employee"
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      >
        {editingEmployee && (
          <EmployeeForm
            initialData={{
              ...editingEmployee,
              dob: editingEmployee.dob ? editingEmployee.dob.toISOString().split("T")[0] : "",
            }}
            designations={designations}
            lastEmpNumber={0}
            onSubmit={handleEdit}
            onCancel={() => setEditingEmployee(null)}
            isLoading={isLoading}
          />
        )}
      </PrimaryPopup>

      {/* Employee Profile Popup */}
      <PrimaryPopup
        trigger={<div />}
        title={`Employee Profile - ${viewingEmployee?.name}`}
        open={!!viewingEmployee}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
      >
        {viewingEmployee && <EmployeeProfile employee={viewingEmployee} />}
      </PrimaryPopup>
    </div>
  )
}
