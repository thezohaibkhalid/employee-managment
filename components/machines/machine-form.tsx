"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { MACHINE_TYPES, MACHINE_TYPE_LABELS } from "../../lib/constants"
import type { MachineFormData, MachineType } from "../../lib/types"

interface MachineFormProps {
  onSubmit: (data: MachineFormData) => void
  onCancel?: () => void
  initialData?: Partial<MachineFormData>
  isLoading?: boolean
}

export function MachineForm({ onSubmit, onCancel, initialData, isLoading }: MachineFormProps) {
  const [formData, setFormData] = useState<MachineFormData>({
    name: initialData?.name || "",
    company: initialData?.company || "",
    type: initialData?.type || ("H17" as MachineType),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof MachineFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Machine" : "Add New Machine"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Machine Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter machine name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Machine Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Machine Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select machine type" />
              </SelectTrigger>
              <SelectContent>
                {MACHINE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MACHINE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Machine" : "Add Machine"}
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
