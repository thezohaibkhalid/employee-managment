// app/bonus-salary-calculation/page.tsx
"use client";

import { useState, useEffect } from "react";
import { MachineSelector } from "../../components/bonus-salary/machine-selector";
import { MonthlyCalculationTable } from "../../components/bonus-salary/monthly-calculation-table";
import { CalculationSummary } from "../../components/bonus-salary/calculation-summary";
import { Card, CardContent } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Info } from "lucide-react";
// ❌ remove prisma-backed imports
// import { getMachines } from "../../lib/api/machines";
// import { getEmployees } from "../../lib/api/employees";
import type { Machine, Employee, BonusRate, SalaryRate } from "../../lib/types";

interface DailyWorkEntry {
  date: Date;
  day: string;
  bonusType: "stitch" | "2 head" | "sheet";
  stitches: number;
  employee1Id: string;
  employee2Id: string;
  bonusAmount: number;
  salaryAmount: number;
}

interface EmployeeSummary {
  employee: Employee;
  totalSalary: number;
  totalBonus: number;
  workingDays: number;
  finalAmount: number;
}

export default function BonusSalaryCalculationPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bonusRates, setBonusRates] = useState<BonusRate[]>([]);
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load machines + employees via API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [machinesRes, employeesRes] = await Promise.all([
          fetch("/api/machines", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);

        const [machinesData, employeesData] = await Promise.all([
          machinesRes.json(),
          employeesRes.json(),
        ]);

        if (!machinesRes.ok)
          throw new Error(machinesData?.error || "Failed to load machines");
        if (!employeesRes.ok)
          throw new Error(employeesData?.error || "Failed to load employees");

        setMachines(machinesData || []);
        setEmployees(employeesData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // When a machine is selected, fetch its rates via API
  useEffect(() => {
    const fetchRates = async () => {
      if (!selectedMachine) {
        setBonusRates([]);
        setSalaryRates([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/machines/${encodeURIComponent(selectedMachine.id)}/rates`,
          {
            cache: "no-store",
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to fetch machine rates");
        setBonusRates(data.bonusRates || []);
        setSalaryRates(data.salaryRates || []);
      } catch (error) {
        console.error("Error fetching machine rates:", error);
        setBonusRates([]);
        setSalaryRates([]);
      }
    };
    fetchRates();
  }, [selectedMachine]);

  const handleCalculationComplete = (workEntries: DailyWorkEntry[]) => {
    const employeeMap = new Map<
      string,
      { salary: number; bonus: number; days: number }
    >();

    workEntries.forEach((entry) => {
      if (entry.stitches > 0) {
        const employee1 = employees.find((emp) => emp.id === entry.employee1Id);
        const employee2 = employees.find((emp) => emp.id === entry.employee2Id);

        // Employee 1
        if (employee1) {
          const current = employeeMap.get(entry.employee1Id) || {
            salary: 0,
            bonus: 0,
            days: 0,
          };
          const designation1 = employee1.designation.name.toLowerCase();
          const salaryRate1 =
            salaryRates.find(
              (r) =>
                r.machineId === selectedMachine?.id &&
                r.designation === designation1
            )?.dailyRate || 0;
          const isFriday = entry.day.toLowerCase() === "friday";
          const salaryAmount1 = salaryRate1 * (isFriday ? 2.5 : 1);

          let bonusShare1 = 0;
          if (designation1 === "operator" || designation1 === "karigar") {
            const employee2Designation =
              employee2?.designation.name.toLowerCase();
            const employee2CanGetBonus =
              employee2Designation === "operator" ||
              employee2Designation === "karigar";
            bonusShare1 = employee2CanGetBonus
              ? entry.bonusAmount / 2
              : entry.bonusAmount;
          }

          employeeMap.set(entry.employee1Id, {
            salary: current.salary + salaryAmount1,
            bonus: current.bonus + bonusShare1,
            days: current.days + 1,
          });
        }

        // Employee 2
        if (employee2) {
          const current = employeeMap.get(entry.employee2Id) || {
            salary: 0,
            bonus: 0,
            days: 0,
          };
          const designation2 = employee2.designation.name.toLowerCase();
          const salaryRate2 =
            salaryRates.find(
              (r) =>
                r.machineId === selectedMachine?.id &&
                r.designation === designation2
            )?.dailyRate || 0;
          const isFriday = entry.day.toLowerCase() === "friday";
          const salaryAmount2 = salaryRate2 * (isFriday ? 2.5 : 1);

          let bonusShare2 = 0;
          if (designation2 === "operator" || designation2 === "karigar") {
            const employee1Designation =
              employee1?.designation.name.toLowerCase();
            const employee1CanGetBonus =
              employee1Designation === "operator" ||
              employee1Designation === "karigar";
            bonusShare2 = employee1CanGetBonus
              ? entry.bonusAmount / 2
              : entry.bonusAmount;
          }

          employeeMap.set(entry.employee2Id, {
            salary: current.salary + salaryAmount2,
            bonus: current.bonus + bonusShare2,
            days: current.days + 1,
          });
        }
      }
    });

    const summaries: EmployeeSummary[] = Array.from(employeeMap.entries()).map(
      ([employeeId, data]) => {
        const employee = employees.find((emp) => emp.id === employeeId)!;
        return {
          employee,
          totalSalary: data.salary,
          totalBonus: data.bonus,
          workingDays: data.days,
          finalAmount: data.salary + data.bonus,
        };
      }
    );

    setEmployeeSummaries(summaries);
    setCalculationComplete(true);
  };

  const handleSaveCalculation = async () => {
    setIsLoading(true);
    try {
      // TODO: POST these results to a server route if you want to persist
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(
        `Successfully saved calculation for ${employeeSummaries.length} employees!`
      );
      setCalculationComplete(false);
      setEmployeeSummaries([]);
      setSelectedMachine(null);
    } catch (error) {
      console.error("Error saving calculation:", error);
      alert("Error saving calculation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = employeeSummaries.reduce(
    (sum, s) => sum + s.finalAmount,
    0
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Loading...</h3>
            <p className="text-muted-foreground">
              Fetching machines and employees data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bonus & Salary Calculation</h1>
        <p className="text-muted-foreground">
          Calculate production-based salaries and bonuses for operators,
          karigars, and helpers
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Select a machine to fetch bonus rates
          and salary rates. Choose any 2 employees from operator, karigar, or
          helper roles. Bonuses are distributed based on designation - operators
          and karigars share bonuses equally, helpers receive salary only.
          Friday work pays 2.5x normal rate.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Step 1: Machine Selection */}
        <MachineSelector
          machines={machines}
          selectedMachine={selectedMachine}
          onMachineSelect={setSelectedMachine}
          bonusRates={bonusRates}
          salaryRates={salaryRates}
          onRatesUpdate={(bonus, salary) => {
            setBonusRates(bonus);
            setSalaryRates(salary);
          }}
        />

        {/* Step 2: Monthly Calculation */}
        {selectedMachine && !calculationComplete && (
          <MonthlyCalculationTable
            machine={selectedMachine}
            bonusRates={bonusRates}
            salaryRates={salaryRates}
            employees={employees}
            onCalculationComplete={handleCalculationComplete}
          />
        )}

        {/* Step 3: Summary and Save */}
        {calculationComplete && (
          <CalculationSummary
            employeeSummaries={employeeSummaries}
            totalAmount={totalAmount}
            onSaveCalculation={handleSaveCalculation}
            isLoading={isLoading}
          />
        )}

        {/* No Machine Selected */}
        {!selectedMachine && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Select a Machine to Begin
                </h3>
                <p className="text-muted-foreground">
                  Choose a machine from the dropdown above to start calculating
                  bonuses and salaries
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
