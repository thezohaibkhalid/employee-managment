// app/salary-calculation/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { SalaryCalculator } from "../../components/salary/salary-calculator";
import { SalaryHistory } from "../../components/salary/salary-history";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Calculator, History, TrendingUp } from "lucide-react";
import type { Employee } from "../../lib/types";

// Fallback types if your components expect a shape
type AnySalaryCalc = any;

export default function SalaryCalculationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Load employees + current month salary records from API
  useEffect(() => {
    const load = async () => {
      try {
        setInitialLoading(true);
        const [empRes, recRes] = await Promise.all([
          fetch(`/api/employees`, { cache: "no-store" }),
          fetch(
            `/api/salary/records?month=${currentMonth}&year=${currentYear}`,
            { cache: "no-store" }
          ),
        ]);
        if (!empRes.ok) throw new Error("Failed to fetch employees");
        if (!recRes.ok) throw new Error("Failed to fetch salary records");

        const [empData, recData] = await Promise.all([
          empRes.json(),
          recRes.json(),
        ]);
        setEmployees(empData || []);
        setSalaryRecords(recData || []);
      } catch (e) {
        console.error("Initial load error:", e);
        setEmployees([]);
        setSalaryRecords([]);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [currentMonth, currentYear]);

  // Adapter: make employees look like the mock structure the calculator expects
  // - expose `designation.hasFixedSalary` (derived from !isVariablePay)
  // - expose `salary` (derived from fixedMonthlySalary)
  const calcEmployees = useMemo(() => {
    return (employees || []).map((e: any) => ({
      ...e,
      salary: e.fixedMonthlySalary ?? 0,
      designation: {
        ...e.designation,
        hasFixedSalary: !e.designation?.isVariablePay,
      },
    }));
  }, [employees]);

  const fixedSalaryEmployees = useMemo(
    () =>
      calcEmployees.filter(
        (emp: any) => emp.designation?.hasFixedSalary && emp.salary
      ),
    [calcEmployees]
  );

  const currentMonthRecords = useMemo(
    () =>
      (salaryRecords || []).filter(
        (r: any) => r.month === currentMonth && r.year === currentYear
      ),
    [salaryRecords, currentMonth, currentYear]
  );

  const totalCurrentMonth = useMemo(
    () =>
      currentMonthRecords.reduce(
        (sum: number, r: any) =>
          sum + Number(r.total_salary ?? r.totalSalary ?? r.final_salary ?? 0),
        0
      ),
    [currentMonthRecords]
  );

  // Accepts array emitted from SalaryCalculator and persists via API (bulk-friendly)
  const handleCalculateSalaries = async (calculations: AnySalaryCalc[]) => {
    setIsLoading(true);
    try {
      // POST array to bulk create
      const res = await fetch(`/api/salary/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calculations),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save salary records");
      }
      const created = await res.json();

      // Merge to local state
      setSalaryRecords((prev) => [...created, ...prev]);

      alert(
        `Successfully calculated & saved salaries for ${calculations.length} employees!`
      );
    } catch (error) {
      console.error("Error calculating/saving salaries:", error);
      alert("Error calculating/saving salaries. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Loading...</h3>
          <p className="text-muted-foreground">
            Fetching employees and salary records
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Salary Calculation System</h1>
        <p className="text-muted-foreground">
          Calculate and manage salaries for fixed-salary employees
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {fixedSalaryEmployees.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Fixed Salary Employees
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  Rs. {Number(totalCurrentMonth).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current Month Total
                </p>
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
                Calculate salaries for employees with fixed monthly salaries.
                Includes Friday multipliers, holidays, and deductions.
              </p>
            </CardHeader>
            <CardContent>
              <SalaryCalculator
                employees={calcEmployees}
                onCalculate={handleCalculateSalaries}
                isLoading={isLoading}
              />
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
              <SalaryHistory
                salaryRecords={salaryRecords}
                employees={calcEmployees}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
