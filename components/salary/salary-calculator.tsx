"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { getDaysInMonth, getFridaysInMonth, calculateDailySalary } from "../../lib/utils/salary"
import type { Employee, SalaryCalculation } from "../../lib/types"

interface SalaryCalculatorProps {
  employees: Employee[]
  onCalculate: (calculations: SalaryCalculation[]) => void
  isLoading?: boolean
}

export function SalaryCalculator({ employees, onCalculate, isLoading }: SalaryCalculatorProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [employeeData, setEmployeeData] = useState<
    Record<
      string,
      {
        workingDays: number
        fridayDays: number
        normalLeaves: number
        fridayLeaves: number
        holidays: number
        bonus: number
        advance: number
      }
    >
  >({})

  const fixedSalaryEmployees = employees.filter((emp) => emp.designation.hasFixedSalary && emp.salary)
  const totalDaysInMonth = getDaysInMonth(selectedMonth, selectedYear)
  const fridaysInMonth = getFridaysInMonth(selectedMonth, selectedYear)

  const handleEmployeeSelect = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees((prev) => [...prev, employeeId])
      // Initialize with default values
      setEmployeeData((prev) => ({
        ...prev,
        [employeeId]: {
          workingDays: totalDaysInMonth,
          fridayDays: fridaysInMonth,
          normalLeaves: 0,
          fridayLeaves: 0,
          holidays: 0,
          bonus: 0,
          advance: 0,
        },
      }))
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId))
      setEmployeeData((prev) => {
        const newData = { ...prev }
        delete newData[employeeId]
        return newData
      })
    }
  }

  const handleEmployeeDataChange = (employeeId: string, field: string, value: number) => {
    setEmployeeData((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }))
  }

  const calculateSalary = (employee: Employee) => {
    const data = employeeData[employee.id]
    if (!data || !employee.salary) return 0

    const dailyRates = calculateDailySalary(employee.salary, selectedMonth, selectedYear)
    const normalWorkDays = data.workingDays - data.fridayDays
    const workSalary = normalWorkDays * dailyRates.normalDay + data.fridayDays * dailyRates.fridayDay
    const holidayPay = data.holidays * dailyRates.fridayDay

    return workSalary + holidayPay + data.bonus - data.advance
  }

  const handleCalculateAll = () => {
    const calculations: SalaryCalculation[] = selectedEmployees.map((employeeId) => {
      const employee = employees.find((emp) => emp.id === employeeId)!
      const data = employeeData[employeeId]

      return {
        id: Date.now().toString() + employeeId,
        employeeId,
        month: selectedMonth,
        year: selectedYear,
        baseSalary: employee.salary || 0,
        workingDays: data.workingDays,
        fridayDays: data.fridayDays,
        normalLeaves: data.normalLeaves,
        fridayLeaves: data.fridayLeaves,
        holidays: data.holidays,
        bonus: data.bonus,
        advance: data.advance,
        totalSalary: calculateSalary(employee),
        createdAt: new Date(),
      }
    })

    onCalculate(calculations)
  }

  const totalSalaryAmount = selectedEmployees.reduce((sum, employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    return sum + (employee ? calculateSalary(employee) : 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Calculation Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Month Info</Label>
              <div className="text-sm text-muted-foreground">
                <p>Total Days: {totalDaysInMonth}</p>
                <p>Fridays: {fridaysInMonth}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Employees ({selectedEmployees.length} selected)</CardTitle>
        </CardHeader>
        <CardContent>
          {fixedSalaryEmployees.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No employees with fixed salaries found. Add employees with fixed salary designations first.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedSalaryEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked === true)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.empId}</p>
                    <Badge variant="secondary" className="text-xs">
                      Rs. {employee.salary?.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Details */}
      {selectedEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Salary Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedEmployees.map((employeeId) => {
                const employee = employees.find((emp) => emp.id === employeeId)!
                const data = employeeData[employeeId]
                const calculatedSalary = calculateSalary(employee)

                return (
                  <div key={employeeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{employee.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {employee.empId} • Rs. {employee.salary?.toLocaleString()} / month
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg font-semibold">
                        Rs. {Math.max(0, calculatedSalary).toLocaleString()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Working Days</Label>
                        <Input
                          type="number"
                          min="0"
                          max={totalDaysInMonth}
                          value={data?.workingDays || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "workingDays", Number.parseInt(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Friday Days</Label>
                        <Input
                          type="number"
                          min="0"
                          max={data?.workingDays || 0}
                          value={data?.fridayDays || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "fridayDays", Number.parseInt(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Normal Leaves</Label>
                        <Input
                          type="number"
                          min="0"
                          value={data?.normalLeaves || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "normalLeaves", Number.parseInt(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Friday Leaves</Label>
                        <Input
                          type="number"
                          min="0"
                          value={data?.fridayLeaves || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "fridayLeaves", Number.parseInt(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Holidays (2.5x)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={data?.holidays || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "holidays", Number.parseInt(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Bonus</Label>
                        <Input
                          type="number"
                          min="0"
                          value={data?.bonus || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "bonus", Number.parseFloat(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Advance</Label>
                        <Input
                          type="number"
                          min="0"
                          value={data?.advance || 0}
                          onChange={(e) =>
                            handleEmployeeDataChange(employeeId, "advance", Number.parseFloat(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary and Calculate */}
      {selectedEmployees.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Total Salary Amount</p>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployees.length} employees for{" "}
                  {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">Rs. {Math.max(0, totalSalaryAmount).toLocaleString()}</p>
                <Button onClick={handleCalculateAll} disabled={isLoading} className="mt-2">
                  {isLoading ? "Processing..." : "Calculate & Save Salaries"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
