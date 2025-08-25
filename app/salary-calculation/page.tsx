"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { SalaryCalculator } from "../../components/salary/salary-calculator"
import { SalaryHistory } from "../../components/salary/salary-history"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Calculator, History, TrendingUp } from "lucide-react"
import { mockEmployees } from "../../lib/data/mock-data"
import type { Employee, SalaryCalculation } from "../../lib/types"

export default function SalaryCalculationPage() {
  const [employees] = useState<Employee[]>(mockEmployees)
  const [salaryRecords, setSalaryRecords] = useState<SalaryCalculation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleCalculateSalaries = async (calculations: SalaryCalculation[]) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSalaryRecords((prev) => [...prev, ...calculations])

      // Show success message
      alert(`Successfully calculated salaries for ${calculations.length} employees!`)
    } catch (error) {
      console.error("Error calculating salaries:", error)
      alert("Error calculating salaries. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fixedSalaryEmployees = employees.filter((emp) => emp.designation.hasFixedSalary && emp.salary)
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentMonthRecords = salaryRecords.filter(
    (record) => record.month === currentMonth && record.year === currentYear,
  )
  const totalCurrentMonth = currentMonthRecords.reduce((sum, record) => sum + record.totalSalary, 0)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Salary Calculation System</h1>
        <p className="text-muted-foreground">Calculate and manage salaries for fixed-salary employees</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{fixedSalaryEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Fixed Salary Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">Rs. {totalCurrentMonth.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Current Month Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{salaryRecords.length}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Salary Calculator</TabsTrigger>
          <TabsTrigger value="history">Salary History</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Monthly Salary Calculator
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Calculate salaries for employees with fixed monthly salaries. Includes Friday multipliers, holidays, and
                deductions.
              </p>
            </CardHeader>
            <CardContent>
              <SalaryCalculator employees={employees} onCalculate={handleCalculateSalaries} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Salary History & Records
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and filter historical salary calculations and records.
              </p>
            </CardHeader>
            <CardContent>
              <SalaryHistory salaryRecords={salaryRecords} employees={employees} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
