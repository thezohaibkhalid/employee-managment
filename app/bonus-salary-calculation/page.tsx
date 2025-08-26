"use client";

import { useState, useEffect } from "react";
import { MachineSelector } from "@/components/bonus-salary/machine-selector";
import { MonthlyCalculationTable } from "@/components/bonus-salary/monthly-calculation-table";
import { CalculationSummary } from "@/components/bonus-salary/calculation-summary";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { Machine, Employee, BonusRate, SalaryRate } from "@/lib/types";

interface DailyWorkEntry {
  date: Date;
  day: string; // e.g. "Friday"
  bonusType: "stitch" | "2 head" | "sheet";
  stitches: number;
  employee1Id: string;
  employee2Id: string;
  bonusAmount: number; // total bonus for the day (before split)
  salaryAmount: number; // (not used here; we re-calc)
}

interface EmployeeSummary {
  employee: Employee;
  totalSalary: number;
  totalBonus: number;
  workingDays: number;
  finalAmount: number;
}

const FRIDAY_MULTIPLIER = 1.5; // <- 1.5× total (not 2.5×)

const norm = (s?: string) => (s || "").trim().toLowerCase();
const isFriday = (entry: DailyWorkEntry) => {
  // robust: prefer Date, fallback to label
  if (entry?.date) {
    const d = new Date(entry.date);
    return d.getDay() === 5; // 0..6, Friday=5
  }
  return norm(entry.day).startsWith("fri");
};

/** Pull a daily rate for a designation, regardless of shape */
function resolveDailyRate(
  rates: SalaryRate[],
  designation: string,
  selectedMachineId?: string | null
) {
  const d = norm(designation);
  // try (machineId + designation) first
  const byMachine =
    rates.find(
      (r: any) =>
        (r.machineId ? r.machineId === selectedMachineId : true) &&
        norm((r as any).designation ?? (r as any).designation?.name) === d
    ) ||
    rates.find(
      (r: any) =>
        norm((r as any).designation ?? (r as any).designation?.name) === d
    );

  if (!byMachine) return 0;

  // support either .dailyRate or Prisma payload with .monthlySalary
  const daily =
    (byMachine as any).dailyRate ??
    ((byMachine as any).monthlySalary
      ? Number(byMachine as any).monthlySalary / 30
      : 0);

  return Number(daily) || 0;
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

  // ✅ client-safe loading (don’t import prisma code in a client component)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [mRes, eRes] = await Promise.all([
          fetch("/api/machines", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);
        const [machinesData, employeesData] = await Promise.all([
          mRes.json(),
          eRes.json(),
        ]);
        if (!mRes.ok)
          throw new Error(machinesData?.error || "Failed to load machines");
        if (!eRes.ok)
          throw new Error(employeesData?.error || "Failed to load employees");

        setMachines(machinesData || []);
        setEmployees(employeesData || []);
      } catch (err) {
        console.error("Error loading data:", err);
        setMachines([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCalculationComplete = (workEntries: DailyWorkEntry[]) => {
    // employeeId → tally
    const tally = new Map<
      string,
      { salary: number; bonus: number; days: number }
    >();

    for (const entry of workEntries) {
      const e1 = employees.find((x) => x.id === entry.employee1Id);
      const e2 = employees.find((x) => x.id === entry.employee2Id);

      const friday = isFriday(entry);

      // --- Salary (paid if the employee is assigned that day, regardless of stitches) ---
      if (e1) {
        const d1 = norm(e1.designation?.name);
        const rate1 = resolveDailyRate(salaryRates, d1, selectedMachine?.id);
        const dayPay1 = rate1 * (friday ? FRIDAY_MULTIPLIER : 1);

        const prev = tally.get(e1.id) || { salary: 0, bonus: 0, days: 0 };
        tally.set(e1.id, {
          salary: prev.salary + dayPay1,
          bonus: prev.bonus, // bonus added below
          days: prev.days + 1,
        });
      }

      if (e2) {
        const d2 = norm(e2.designation?.name);
        const rate2 = resolveDailyRate(salaryRates, d2, selectedMachine?.id);
        const dayPay2 = rate2 * (friday ? FRIDAY_MULTIPLIER : 1);

        const prev = tally.get(e2.id) || { salary: 0, bonus: 0, days: 0 };
        tally.set(e2.id, {
          salary: prev.salary + dayPay2,
          bonus: prev.bonus,
          days: prev.days + 1,
        });
      }

      // --- Bonus (only if stitches/bonus > 0) ---
      if (entry.stitches > 0 && entry.bonusAmount > 0) {
        const e1Can =
          e1 &&
          (norm(e1.designation?.name) === "operator" ||
            norm(e1.designation?.name) === "karigar");
        const e2Can =
          e2 &&
          (norm(e2.designation?.name) === "operator" ||
            norm(e2.designation?.name) === "karigar");

        if (e1Can && e2Can) {
          // split 50/50
          const half = entry.bonusAmount / 2;
          if (e1) {
            const prev = tally.get(e1.id)!;
            tally.set(e1.id, { ...prev, bonus: prev.bonus + half });
          }
          if (e2) {
            const prev = tally.get(e2.id)!;
            tally.set(e2.id, { ...prev, bonus: prev.bonus + half });
          }
        } else if (e1Can && e1) {
          const prev = tally.get(e1.id)!;
          tally.set(e1.id, { ...prev, bonus: prev.bonus + entry.bonusAmount });
        } else if (e2Can && e2) {
          const prev = tally.get(e2.id)!;
          tally.set(e2.id, { ...prev, bonus: prev.bonus + entry.bonusAmount });
        }
        // helpers don’t receive bonus
      }
    }

    // → summaries
    const summaries: EmployeeSummary[] = [...tally.entries()].map(
      ([employeeId, t]) => {
        const employee = employees.find((emp) => emp.id === employeeId)!;
        const finalAmount = t.salary + t.bonus;
        return {
          employee,
          totalSalary: t.salary,
          totalBonus: t.bonus,
          workingDays: t.days,
          finalAmount,
        };
      }
    );

    setEmployeeSummaries(summaries);
    setCalculationComplete(true);
  };

  const handleSaveCalculation = async () => {
    setIsLoading(true);
    try {
      // TODO: POST summaries to your API if needed
      await new Promise((r) => setTimeout(r, 400));
      alert(
        `Successfully saved calculation for ${employeeSummaries.length} employees!`
      );
      setCalculationComplete(false);
      setEmployeeSummaries([]);
      setSelectedMachine(null);
    } catch (e) {
      console.error(e);
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

      {/* Info */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Select a machine to fetch bonus and
          salary rates. Choose any 2 employees (operator / karigar / helper).
          Operators & karigars share bonuses equally (helpers don’t get bonus).
          <strong> Friday work pays 1.5×</strong> the normal daily rate.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
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

        {selectedMachine && !calculationComplete && (
          <MonthlyCalculationTable
            machine={selectedMachine}
            bonusRates={bonusRates}
            salaryRates={salaryRates}
            employees={employees}
            onCalculationComplete={handleCalculationComplete}
          />
        )}

        {calculationComplete && (
          <CalculationSummary
            employeeSummaries={employeeSummaries}
            totalAmount={totalAmount}
            onSaveCalculation={handleSaveCalculation}
            isLoading={isLoading}
          />
        )}

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
