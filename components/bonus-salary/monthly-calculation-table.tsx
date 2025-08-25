"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { getDaysInMonth } from "../../lib/utils/salary"
import type { Machine, BonusRate, SalaryRate, Employee } from "../../lib/types"

interface DailyWorkEntry {
  date: Date
  day: string
  bonusType: "stitch" | "2 head" | "sheet"
  stitches: number
  employee1Id: string
  employee2Id: string
  bonusAmount: number
  salaryAmount: number
}

interface MonthlyCalculationTableProps {
  machine: Machine
  bonusRates: BonusRate[]
  salaryRates: SalaryRate[]
  employees: Employee[]
  onCalculationComplete: (workEntries: DailyWorkEntry[]) => void
}

export function MonthlyCalculationTable({
  machine,
  bonusRates,
  salaryRates,
  employees,
  onCalculationComplete,
}: MonthlyCalculationTableProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [workEntries, setWorkEntries] = useState<DailyWorkEntry[]>([])
  const [defaultEmployee1, setDefaultEmployee1] = useState("")
  const [defaultEmployee2, setDefaultEmployee2] = useState("")

  const workerEmployees = employees.filter((emp) =>
    ["operator", "karigar", "helper"].includes(emp.designation.name.toLowerCase()),
  )

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)

  // Initialize work entries when month/year changes
  useEffect(() => {
    const entries: DailyWorkEntry[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })

      entries.push({
        date,
        day: dayName,
        bonusType: "stitch",
        stitches: 0,
        employee1Id: defaultEmployee1,
        employee2Id: defaultEmployee2,
        bonusAmount: 0,
        salaryAmount: 0,
      })
    }
    setWorkEntries(entries)
  }, [selectedMonth, selectedYear, daysInMonth, defaultEmployee1, defaultEmployee2])

  const getBonusRate = (bonusType: string) => {
    const rate = bonusRates.find((r) => r.machineId === machine.id && r.bonusType === bonusType)
    return rate?.rate || 0
  }

  const getSalaryRate = (designation: string) => {
    const rate = salaryRates.find((r) => r.machineId === machine.id && r.designation === designation)
    return rate?.dailyRate || 0
  }

  const calculateDayAmounts = (entry: DailyWorkEntry) => {
    const bonusRate = getBonusRate(entry.bonusType)
    const bonusAmount = entry.stitches * bonusRate

    const employee1 = employees.find((emp) => emp.id === entry.employee1Id)
    const employee2 = employees.find((emp) => emp.id === entry.employee2Id)

    let salaryAmount = 0
    const isFriday = entry.day.toLowerCase() === "friday"
    const multiplier = isFriday ? 2.5 : 1

    // Calculate salary for employee 1
    if (employee1) {
      const designation1 = employee1.designation.name.toLowerCase()
      const rate1 = getSalaryRate(designation1)
      salaryAmount += rate1 * multiplier
    }

    // Calculate salary for employee 2
    if (employee2) {
      const designation2 = employee2.designation.name.toLowerCase()
      const rate2 = getSalaryRate(designation2)
      salaryAmount += rate2 * multiplier
    }

    return { bonusAmount, salaryAmount }
  }

  const updateWorkEntry = (index: number, field: keyof DailyWorkEntry, value: any) => {
    const updatedEntries = [...workEntries]
    updatedEntries[index] = { ...updatedEntries[index], [field]: value }

    // Recalculate amounts
    const { bonusAmount, salaryAmount } = calculateDayAmounts(updatedEntries[index])
    updatedEntries[index].bonusAmount = bonusAmount
    updatedEntries[index].salaryAmount = salaryAmount

    setWorkEntries(updatedEntries)
  }

  const applyDefaultEmployees = () => {
    const updatedEntries = workEntries.map((entry) => ({
      ...entry,
      employee1Id: defaultEmployee1,
      employee2Id: defaultEmployee2,
    }))

    // Recalculate all amounts
    updatedEntries.forEach((entry, index) => {
      const { bonusAmount, salaryAmount } = calculateDayAmounts(entry)
      updatedEntries[index].bonusAmount = bonusAmount
      updatedEntries[index].salaryAmount = salaryAmount
    })

    setWorkEntries(updatedEntries)
  }

  const getEmployeeDisplayInfo = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    if (!employee) return { name: "Not Selected", designation: "", empId: "" }
    return {
      name: employee.name,
      designation: employee.designation.name,
      empId: employee.empId,
    }
  }

  const totalBonus = workEntries.reduce((sum, entry) => sum + entry.bonusAmount, 0)
  const totalSalary = workEntries.reduce((sum, entry) => sum + entry.salaryAmount, 0)

  return (
    <div className="space-y-6">
      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
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
              <Label>Year</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Selection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select any 2 employees from operator, karigar, or helper. Their salary and bonus will be calculated based on
            their designation and machine assignment.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee 1</Label>
              <Select value={defaultEmployee1} onValueChange={setDefaultEmployee1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first employee" />
                </SelectTrigger>
                <SelectContent>
                  {workerEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.empId}) - {emp.designation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employee 2</Label>
              <Select value={defaultEmployee2} onValueChange={setDefaultEmployee2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second employee" />
                </SelectTrigger>
                <SelectContent>
                  {workerEmployees
                    .filter((emp) => emp.id !== defaultEmployee1) // Prevent selecting same employee twice
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.empId}) - {emp.designation.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={applyDefaultEmployees} className="mt-4" disabled={!defaultEmployee1 || !defaultEmployee2}>
            Apply to All Days
          </Button>
        </CardContent>
      </Card>

      {/* Daily Work Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Daily Work Entries -{" "}
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Bonus: Rs. {totalBonus.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Salary: Rs. {totalSalary.toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {workEntries.map((entry, index) => (
                <div key={index} className="grid grid-cols-7 gap-2 p-3 border rounded-lg items-center">
                  {/* Date & Day */}
                  <div className="text-sm">
                    <p className="font-medium">{entry.date.getDate()}</p>
                    <Badge variant={entry.day.toLowerCase() === "friday" ? "default" : "secondary"} className="text-xs">
                      {entry.day.slice(0, 3)}
                    </Badge>
                  </div>

                  {/* Bonus Type */}
                  <Select value={entry.bonusType} onValueChange={(value) => updateWorkEntry(index, "bonusType", value)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stitch">Stitch</SelectItem>
                      <SelectItem value="2 head">2 Head</SelectItem>
                      <SelectItem value="sheet">Sheet</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Stitches */}
                  <Input
                    type="number"
                    min="0"
                    value={entry.stitches}
                    onChange={(e) => updateWorkEntry(index, "stitches", Number.parseInt(e.target.value) || 0)}
                    className="h-8"
                    placeholder="0"
                  />

                  <Select
                    value={entry.employee1Id}
                    onValueChange={(value) => updateWorkEntry(index, "employee1Id", value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Employee 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {workerEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} - {emp.designation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={entry.employee2Id}
                    onValueChange={(value) => updateWorkEntry(index, "employee2Id", value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Employee 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {workerEmployees
                        .filter((emp) => emp.id !== entry.employee1Id) // Prevent selecting same employee twice
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.designation.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Bonus Amount */}
                  <div className="text-sm text-right">
                    <p className="font-medium">Rs. {entry.bonusAmount.toFixed(2)}</p>
                  </div>

                  {/* Salary Amount */}
                  <div className="text-sm text-right">
                    <p className="font-medium">Rs. {entry.salaryAmount.toFixed(2)}</p>
                    {entry.day.toLowerCase() === "friday" && <p className="text-xs text-blue-600">2.5x</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => onCalculationComplete(workEntries)}
              size="lg"
              disabled={!defaultEmployee1 || !defaultEmployee2}
            >
              Complete Calculation & Distribute
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
