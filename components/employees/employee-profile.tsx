"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Textarea } from "../ui/textarea"
import { Plus } from "lucide-react"
import type { Employee, EmployeeAdvance, SalaryCalculation } from "../../lib/types"

interface EmployeeProfileProps {
  employee: Employee
}

export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([])
  const [salaryRecords, setSalaryRecords] = useState<SalaryCalculation[]>([])
  const [newAdvance, setNewAdvance] = useState({ amount: 0, description: "" })
  const [isAddingAdvance, setIsAddingAdvance] = useState(false)

  const handleAddAdvance = () => {
    if (newAdvance.amount > 0) {
      const advance: EmployeeAdvance = {
        id: Date.now().toString(),
        employeeId: employee.id,
        amount: newAdvance.amount,
        description: newAdvance.description,
        createdAt: new Date(),
      }
      setAdvances((prev) => [...prev, advance])
      setNewAdvance({ amount: 0, description: "" })
      setIsAddingAdvance(false)
    }
  }

  const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0)

  return (
    <div className="space-y-6">
      {/* Employee Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{employee.name}</CardTitle>
              <p className="text-muted-foreground">{employee.empId}</p>
            </div>
            <Badge variant="secondary">{employee.designation.name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-medium">Father Name:</span> {employee.fatherName}
              </p>
              <p>
                <span className="font-medium">CNIC:</span> {employee.cnic}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {employee.phoneNumber}
              </p>
              <p>
                <span className="font-medium">City:</span> {employee.city}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Gender:</span> {employee.gender}
              </p>
              <p>
                <span className="font-medium">Blood Group:</span> {employee.bloodGroup}
              </p>
              {employee.salary && (
                <p>
                  <span className="font-medium">Monthly Salary:</span> Rs. {employee.salary.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="advances" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="salary">Salary Records</TabsTrigger>
          <TabsTrigger value="calculation">Salary Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="advances" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Advance Management</CardTitle>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Advances</p>
                  <p className="text-lg font-semibold text-destructive">Rs. {totalAdvances.toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {advances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No advances recorded</p>
                ) : (
                  <div className="space-y-2">
                    {advances.map((advance) => (
                      <div key={advance.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Rs. {advance.amount.toLocaleString()}</p>
                          {advance.description && (
                            <p className="text-sm text-muted-foreground">{advance.description}</p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{advance.createdAt.toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingAdvance ? (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label htmlFor="advance-amount">Amount</Label>
                      <Input
                        id="advance-amount"
                        type="number"
                        value={newAdvance.amount || ""}
                        onChange={(e) =>
                          setNewAdvance((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="Enter advance amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="advance-description">Description (Optional)</Label>
                      <Textarea
                        id="advance-description"
                        value={newAdvance.description}
                        onChange={(e) => setNewAdvance((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Reason for advance"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddAdvance} size="sm">
                        Add Advance
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingAdvance(false)} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setIsAddingAdvance(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Advance
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary History</CardTitle>
            </CardHeader>
            <CardContent>
              {salaryRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No salary records found</p>
              ) : (
                <div className="space-y-2">
                  {salaryRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(record.year, record.month - 1).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Working Days: {record.workingDays} | Bonus: Rs. {record.bonus.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Rs. {record.totalSalary.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary Calculator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Calculate salary for employees with fixed salaries (non-operator/karigar/helper)
              </p>
            </CardHeader>
            <CardContent>
              {employee.designation.hasFixedSalary ? (
                <SalaryCalculator employee={employee} totalAdvances={totalAdvances} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Salary calculation for {employee.designation.name} is handled in the Bonus & Salary Calculation
                    section
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SalaryCalculator({ employee, totalAdvances }: { employee: Employee; totalAdvances: number }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [workingDays, setWorkingDays] = useState(0)
  const [fridayDays, setFridayDays] = useState(0)
  const [normalLeaves, setNormalLeaves] = useState(0)
  const [fridayLeaves, setFridayLeaves] = useState(0)
  const [holidays, setHolidays] = useState(0)
  const [bonus, setBonus] = useState(0)

  const baseSalary = employee.salary || 0
  const daysInMonth = new Date(year, month, 0).getDate()

  // Calculate daily rates
  const dailyRate = baseSalary / daysInMonth
  const fridayRate = dailyRate * 2.5

  // Calculate total salary
  const normalWorkDays = workingDays - fridayDays
  const salaryFromWork = normalWorkDays * dailyRate + fridayDays * fridayRate
  const holidayPay = holidays * fridayRate
  const totalSalary = salaryFromWork + holidayPay + bonus - totalAdvances

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Input
            id="month"
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number.parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" value={year} onChange={(e) => setYear(Number.parseInt(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workingDays">Working Days</Label>
          <Input
            id="workingDays"
            type="number"
            min="0"
            max={daysInMonth}
            value={workingDays}
            onChange={(e) => setWorkingDays(Number.parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fridayDays">Friday Days</Label>
          <Input
            id="fridayDays"
            type="number"
            min="0"
            max={workingDays}
            value={fridayDays}
            onChange={(e) => setFridayDays(Number.parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="normalLeaves">Normal Leaves</Label>
          <Input
            id="normalLeaves"
            type="number"
            min="0"
            value={normalLeaves}
            onChange={(e) => setNormalLeaves(Number.parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fridayLeaves">Friday Leaves</Label>
          <Input
            id="fridayLeaves"
            type="number"
            min="0"
            value={fridayLeaves}
            onChange={(e) => setFridayLeaves(Number.parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holidays">Holidays (2.5x pay)</Label>
          <Input
            id="holidays"
            type="number"
            min="0"
            value={holidays}
            onChange={(e) => setHolidays(Number.parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonus">Additional Bonus</Label>
          <Input
            id="bonus"
            type="number"
            min="0"
            value={bonus}
            onChange={(e) => setBonus(Number.parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Monthly Salary:</span>
              <span>Rs. {baseSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Rate:</span>
              <span>Rs. {dailyRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Friday Rate (2.5x):</span>
              <span>Rs. {fridayRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Work Salary:</span>
              <span>Rs. {salaryFromWork.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Holiday Pay:</span>
              <span>Rs. {holidayPay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bonus:</span>
              <span>Rs. {bonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Advances:</span>
              <span>- Rs. {totalAdvances.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Salary:</span>
              <span>Rs. {Math.max(0, totalSalary).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
