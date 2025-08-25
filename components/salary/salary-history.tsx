"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Search } from "lucide-react"
import type { SalaryCalculation, Employee } from "../../lib/types"

interface SalaryHistoryProps {
  salaryRecords: SalaryCalculation[]
  employees: Employee[]
}

export function SalaryHistory({ salaryRecords, employees }: SalaryHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    return employee ? `${employee.name} (${employee.empId})` : "Unknown Employee"
  }

  const filteredRecords = salaryRecords.filter((record) => {
    const employee = employees.find((emp) => emp.id === record.employeeId)
    const matchesSearch = employee
      ? employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.empId.toLowerCase().includes(searchTerm.toLowerCase())
      : false

    const matchesMonth = selectedMonth === "all" || record.month.toString() === selectedMonth
    const matchesYear = selectedYear === "all" || record.year.toString() === selectedYear

    return matchesSearch && matchesMonth && matchesYear
  })

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.totalSalary, 0)
  const uniqueMonths = [...new Set(salaryRecords.map((r) => r.month))].sort()
  const uniqueYears = [...new Set(salaryRecords.map((r) => r.year))].sort()

  if (salaryRecords.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No salary records found. Calculate salaries to see history.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Salary History Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonths.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2024, month - 1).toLocaleDateString("en-US", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">Rs. {totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No records match your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{getEmployeeName(record.employeeId)}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.year, record.month - 1).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-semibold">
                    Rs. {record.totalSalary.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Base Salary</p>
                    <p className="text-muted-foreground">Rs. {record.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Working Days</p>
                    <p className="text-muted-foreground">{record.workingDays}</p>
                  </div>
                  <div>
                    <p className="font-medium">Friday Days</p>
                    <p className="text-muted-foreground">{record.fridayDays}</p>
                  </div>
                  <div>
                    <p className="font-medium">Holidays</p>
                    <p className="text-muted-foreground">{record.holidays}</p>
                  </div>
                  <div>
                    <p className="font-medium">Bonus</p>
                    <p className="text-green-600">+Rs. {record.bonus.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Advance</p>
                    <p className="text-red-600">-Rs. {record.advance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Calculated</p>
                    <p className="text-muted-foreground">{record.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
