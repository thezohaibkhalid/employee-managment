"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import type { Employee } from "../../lib/types"

interface EmployeeSummary {
  employee: Employee
  totalSalary: number
  totalBonus: number
  workingDays: number
  finalAmount: number
}

interface CalculationSummaryProps {
  employeeSummaries: EmployeeSummary[]
  totalAmount: number
  onSaveCalculation: () => void
  isLoading?: boolean
}

export function CalculationSummary({
  employeeSummaries,
  totalAmount,
  onSaveCalculation,
  isLoading,
}: CalculationSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calculation Summary</CardTitle>
          <Badge variant="outline" className="text-lg font-semibold">
            Total: Rs. {totalAmount.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employeeSummaries.map((summary) => (
            <div key={summary.employee.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{summary.employee.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {summary.employee.empId} • {summary.employee.designation.name}
                  </p>
                </div>
                <Badge variant="default" className="text-lg">
                  Rs. {summary.finalAmount.toLocaleString()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Base Salary</p>
                  <p className="text-muted-foreground">Rs. {summary.totalSalary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Bonus</p>
                  <p className="text-green-600">+Rs. {summary.totalBonus.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Working Days</p>
                  <p className="text-muted-foreground">{summary.workingDays}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button onClick={onSaveCalculation} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? "Saving..." : "Save Calculation & Update Employee Records"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
