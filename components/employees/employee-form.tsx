"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Textarea } from "../ui/textarea"
import { GENDER_OPTIONS, BLOOD_GROUPS } from "../../lib/constants"
import type { EmployeeFormData, Designation } from "../../lib/types"

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void
  onCancel?: () => void
  initialData?: Partial<EmployeeFormData>
  designations: Designation[]
  lastEmpNumber: number
  isLoading?: boolean
}

export function EmployeeForm({
  onSubmit,
  onCancel,
  initialData,
  designations,
  lastEmpNumber,
  isLoading,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: initialData?.name || "",
    fatherName: initialData?.fatherName || "",
    dob: initialData?.dob || "",
    cnic: initialData?.cnic || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    designationId: initialData?.designationId || "",
    fixedMonthlySalary: initialData?.fixedMonthlySalary,
    caste: initialData?.caste || "",
    city: initialData?.city || "",
    gender: initialData?.gender || "UNSPECIFIED",
    bloodGroup: initialData?.bloodGroup || "",
    referenceName: initialData?.referenceName || "",
    referencePhone: initialData?.referencePhone || "",
    referenceRelation: initialData?.referenceRelation || "",
    contactPersonName: initialData?.contactPersonName || "",
    contactPersonNumber: initialData?.contactPersonNumber || "",
    contactPersonRelation: initialData?.contactPersonRelation || "",
  })

  const selectedDesignation = designations.find((designation) => designation.id === formData.designationId)
  const needsFixedSalary = selectedDesignation && !selectedDesignation.isVariablePay

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof EmployeeFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextEmpCode = `EMP${lastEmpNumber + 1}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Employee" : `Add New Employee - ${nextEmpCode}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Employee Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName">Father Name</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => handleChange("fatherName", e.target.value)}
                  placeholder="Enter father's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC</Label>
                <Input
                  id="cnic"
                  value={formData.cnic}
                  onChange={(e) => handleChange("cnic", e.target.value)}
                  placeholder="12345-6789012-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="0300-1234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => handleChange("bloodGroup", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caste">Caste</Label>
                <Input
                  id="caste"
                  value={formData.caste}
                  onChange={(e) => handleChange("caste", e.target.value)}
                  placeholder="Enter caste"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter complete address"
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designationId">Designation *</Label>
                <Select value={formData.designationId} onValueChange={(value) => handleChange("designationId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((designation) => (
                      <SelectItem key={designation.id} value={designation.id}>
                        {designation.name} {designation.isVariablePay ? "(Variable Pay)" : "(Fixed Salary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsFixedSalary && (
                <div className="space-y-2">
                  <Label htmlFor="fixedMonthlySalary">Monthly Salary *</Label>
                  <Input
                    id="fixedMonthlySalary"
                    type="number"
                    value={formData.fixedMonthlySalary || ""}
                    onChange={(e) => handleChange("fixedMonthlySalary", Number.parseFloat(e.target.value) || 0)}
                    placeholder="Enter monthly salary"
                    required={needsFixedSalary}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reference Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reference Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referenceName">Reference Name</Label>
                <Input
                  id="referenceName"
                  value={formData.referenceName}
                  onChange={(e) => handleChange("referenceName", e.target.value)}
                  placeholder="Who referred this employee?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencePhone">Reference Phone</Label>
                <Input
                  id="referencePhone"
                  value={formData.referencePhone}
                  onChange={(e) => handleChange("referencePhone", e.target.value)}
                  placeholder="0300-1234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceRelation">Reference Relation</Label>
                <Input
                  id="referenceRelation"
                  value={formData.referenceRelation}
                  onChange={(e) => handleChange("referenceRelation", e.target.value)}
                  placeholder="Friend, Relative, etc."
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">Contact Person Name</Label>
                <Input
                  id="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={(e) => handleChange("contactPersonName", e.target.value)}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonNumber">Contact Person Number</Label>
                <Input
                  id="contactPersonNumber"
                  value={formData.contactPersonNumber}
                  onChange={(e) => handleChange("contactPersonNumber", e.target.value)}
                  placeholder="0300-1234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonRelation">Relation</Label>
                <Input
                  id="contactPersonRelation"
                  value={formData.contactPersonRelation}
                  onChange={(e) => handleChange("contactPersonRelation", e.target.value)}
                  placeholder="Father, Brother, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Employee" : "Add Employee"}
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
