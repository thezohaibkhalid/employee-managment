"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { PrimaryPopup } from "../ui/primary-popup"
import { EmployeeTypeForm } from "./employee-type-form"
import { Edit, Trash2 } from "lucide-react"
import type { Designation } from "../../lib/types"

interface EmployeeTypeFormData {
  name: string
  hasFixedSalary: boolean
  notes?: string
}

interface EmployeeTypeListProps {
  employeeTypes: Designation[]
  onEdit: (id: string, data: EmployeeTypeFormData) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function EmployeeTypeList({ employeeTypes, onEdit, onDelete, isLoading }: EmployeeTypeListProps) {
  const [editingType, setEditingType] = useState<Designation | null>(null)

  const handleEdit = (data: EmployeeTypeFormData) => {
    if (editingType) {
      onEdit(editingType.id, data)
      setEditingType(null)
    }
  }

  const coreTypes = ["operator", "karigar", "helper"]
  const isCoreType = (typeName: string) => coreTypes.includes(typeName.toLowerCase())

  if (employeeTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No employee types added yet. Add your first type to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employeeTypes.map((type) => (
          <Card key={type.id} className={isCoreType(type.name) ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg capitalize">{type.name}</CardTitle>
                  {isCoreType(type.name) && <p className="text-xs text-primary font-medium">Core Type</p>}
                </div>
                <Badge variant={!type.isVariablePay ? "default" : "secondary"}>
                  {!type.isVariablePay ? "Fixed Salary" : "Variable Salary"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {!type.isVariablePay
                    ? "Monthly salary with daily calculations"
                    : "Production-based salary calculations"}
                </div>

                {type.notes && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">{type.notes}</div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingType(type)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(type.id)}
                    disabled={isCoreType(type.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                {isCoreType(type.name) && <p className="text-xs text-muted-foreground">Core types cannot be deleted</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Employee Type Popup */}
      <PrimaryPopup
        trigger={<div />}
        title="Edit Employee Type"
        open={!!editingType}
        onOpenChange={(open) => !open && setEditingType(null)}
      >
        {editingType && (
          <EmployeeTypeForm
            initialData={{
              name: editingType.name,
              hasFixedSalary: !editingType.isVariablePay,
              notes: editingType.notes || "",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingType(null)}
            isLoading={isLoading}
          />
        )}
      </PrimaryPopup>
    </div>
  )
}
