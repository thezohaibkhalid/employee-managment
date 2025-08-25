"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Checkbox } from "../ui/checkbox"
import { Textarea } from "../ui/textarea"

interface EmployeeTypeFormData {
  name: string
  hasFixedSalary: boolean
  notes?: string
}

interface EmployeeTypeFormProps {
  onSubmit: (data: EmployeeTypeFormData) => void
  onCancel?: () => void
  initialData?: Partial<EmployeeTypeFormData>
  isLoading?: boolean
}

export function EmployeeTypeForm({ onSubmit, onCancel, initialData, isLoading }: EmployeeTypeFormProps) {
  const [formData, setFormData] = useState<EmployeeTypeFormData>({
    name: initialData?.name || "",
    hasFixedSalary: initialData?.hasFixedSalary || false,
    notes: initialData?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof EmployeeTypeFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Employee Type" : "Add New Employee Type"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Type Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter employee type name (e.g., supervisor, manager)"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasFixedSalary"
              checked={formData.hasFixedSalary}
              onCheckedChange={(checked) => handleChange("hasFixedSalary", checked === true)}
            />
            <Label htmlFor="hasFixedSalary" className="text-sm font-normal">
              Has Fixed Salary
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional information about this designation"
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Salary Type Guide:</p>
            <p>
              <strong>Fixed Salary:</strong> Employees with monthly salaries (supervisors, managers, etc.)
            </p>
            <p>
              <strong>Variable Salary:</strong> Workers paid based on production (operator, karigar, helper)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Type" : "Add Type"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
