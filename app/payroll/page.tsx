"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Calendar,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import {
  getPayrollRuns,
  getPayslips,
  getPayrollSummary,
} from "../../lib/api/payroll";

export default function PayrollPage() {
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadPayrollData();
  }, [selectedYear, selectedMonth]);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      const [runsData, payslipsData, summaryData] = await Promise.all([
        getPayrollRuns({ year: selectedYear, month: selectedMonth }),
        getPayslips({ year: selectedYear, month: selectedMonth }),
        getPayrollSummary(selectedYear, selectedMonth),
      ]);

      setPayrollRuns(runsData);
      setPayslips(payslipsData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Loading...</h3>
            <p className="text-muted-foreground">Fetching payroll data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-muted-foreground">
          Manage payroll runs, view payslips, and generate reports
        </p>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) =>
                  setSelectedMonth(Number.parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString("en-US", {
                        month: "long",
                      })}
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
                onChange={(e) =>
                  setSelectedYear(Number.parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalRuns}</p>
                  <p className="text-sm text-muted-foreground">Payroll Runs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalEmployees}</p>
                  <p className="text-sm text-muted-foreground">
                    Employees Paid
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    Rs. {summary.totalGrossBonus.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Bonus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    Rs. {summary.totalNetPay.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Net Pay</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="runs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Payroll Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payrollRuns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No payroll runs found for the selected period
                </p>
              ) : (
                <div className="space-y-4">
                  {payrollRuns.map((run) => (
                    <div key={run.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{run.machine.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {run.machine.company.name} •{" "}
                            {run.machine.machineType}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={run.finalizedAt ? "default" : "secondary"}
                          >
                            {run.finalizedAt ? "Finalized" : "Draft"}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {run.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Work Days</p>
                          <p className="font-medium">{run._count.workdays}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Employees</p>
                          <p className="font-medium">{run._count.payslips}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Salary</p>
                          <p className="font-medium">
                            Rs.{" "}
                            {run.payslips
                              .reduce(
                                (sum, p) => sum + Number(p.grossSalary),
                                0
                              )
                              .toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Bonus</p>
                          <p className="font-medium">
                            Rs.{" "}
                            {run.payslips
                              .reduce((sum, p) => sum + Number(p.grossBonus), 0)
                              .toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Employee Payslips
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payslips.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No payslips found for the selected period
                </p>
              ) : (
                <div className="space-y-4">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">
                            {payslip.employee.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {payslip.employee.empCode} •{" "}
                            {payslip.employee.designation.name}
                          </p>
                          {payslip.payrollRun && (
                            <p className="text-sm text-muted-foreground">
                              Machine: {payslip.payrollRun.machine.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            Rs. {Number(payslip.netPay).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Net Pay
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Gross Salary</p>
                          <p className="font-medium">
                            Rs. {Number(payslip.grossSalary).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bonus</p>
                          <p className="font-medium">
                            Rs. {Number(payslip.grossBonus).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Advances</p>
                          <p className="font-medium text-destructive">
                            - Rs.{" "}
                            {Number(payslip.advancesDeducted).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Working Days</p>
                          <p className="font-medium">
                            {payslip.workingDays || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payroll Summary Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!summary ? (
                <p className="text-muted-foreground text-center py-8">
                  No data available for the selected period
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Overall Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {summary.totalEmployees}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Employees
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        Rs. {summary.totalGrossSalary.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Gross Salary
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        Rs. {summary.totalGrossBonus.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Bonus
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        Rs. {summary.totalNetPay.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Net Pay</p>
                    </div>
                  </div>

                  {/* By Machine */}
                  <div>
                    <h4 className="font-semibold mb-3">By Machine</h4>
                    <div className="space-y-2">
                      {summary.byMachine.map((machine, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {machine.machine.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {machine.machine.company.name} •{" "}
                              {machine.employeeCount} employees
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              Rs. {machine.totalNetPay.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Salary: Rs. {machine.totalSalary.toLocaleString()}{" "}
                              | Bonus: Rs. {machine.totalBonus.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By Designation */}
                  <div>
                    <h4 className="font-semibold mb-3">By Designation</h4>
                    <div className="space-y-2">
                      {Object.entries(summary.byDesignation).map(
                        ([designation, data]) => (
                          <div
                            key={designation}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium capitalize">
                                {designation}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {data.count} employees
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                Rs. {data.totalNetPay.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Avg: Rs.{" "}
                                {Math.round(
                                  data.totalNetPay / data.count
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
