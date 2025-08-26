"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  getDaysInMonth,
  getFridaysInMonth,
  calculateDailySalary,
} from "@/lib/utils/salary";
import type { Employee } from "@/lib/types";

interface SalaryCalculation {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  workingDays: number;
  fridayDays: number;
  normalLeaves: number;
  fridayLeaves: number;
  holidays: number; // always 0 in this version
  bonus: number;
  advance: number; // deducted amount (can be partial)
  totalSalary: number;
}

interface SalaryCalculatorProps {
  employees: Employee[]; // adapter fills: salary + designation.hasFixedSalary (+ empCode/empId)
  onCalculate: (calculations: SalaryCalculation[]) => void;
  isLoading?: boolean;
}

type EmpCalcState = {
  workingDays: number;
  normalLeaves: number;
  fridayDays: number; // derived from Friday checkboxes
  fridayLeaves: number; // derived from Friday checkboxes
  bonus: number;
  advanceDeduct: number; // what we deduct this month
  advanceAvailable: number; // what’s available this month
};

export function SalaryCalculator({
  employees,
  onCalculate,
  isLoading,
}: SalaryCalculatorProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeData, setEmployeeData] = useState<
    Record<string, EmpCalcState>
  >({});
  const [empFridayWorked, setEmpFridayWorked] = useState<
    Record<string, Record<number, boolean>>
  >({});

  // month meta
  const daysInMonth = useMemo(
    () => getDaysInMonth(selectedMonth, selectedYear),
    [selectedMonth, selectedYear]
  );
  const fridaysInMonth = useMemo(
    () => getFridaysInMonth(selectedMonth, selectedYear),
    [selectedMonth, selectedYear]
  );
  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const d = new Date(selectedYear, selectedMonth - 1, day);
        return {
          day,
          dow: d.getDay(),
          label: d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
          }),
        };
      }),
    [daysInMonth, selectedMonth, selectedYear]
  );
  const fridayNumbers = useMemo(
    () => days.filter((d) => d.dow === 5).map((d) => d.day),
    [days]
  );

  // fixed-salary only
  const fixedSalaryEmployees = useMemo(
    () =>
      (employees ?? []).filter(
        (e: any) => e?.designation?.hasFixedSalary && e?.salary
      ),
    [employees]
  );

  const seedState = (): EmpCalcState => ({
    workingDays: daysInMonth,
    normalLeaves: 0,
    fridayDays: fridaysInMonth,
    fridayLeaves: 0,
    bonus: 0,
    advanceDeduct: 0,
    advanceAvailable: 0,
  });

  const initFridayMap = (id: string) => {
    setEmpFridayWorked((prev) => {
      const row: Record<number, boolean> = {};
      fridayNumbers.forEach((d) => (row[d] = true)); // default: all Fridays worked
      return { ...prev, [id]: row };
    });
    setEmployeeData((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? seedState()),
        fridayDays: fridayNumbers.length,
        fridayLeaves: 0,
      },
    }));
  };

  // month/year change ⇒ reset friday maps & recompute defaults
  useEffect(() => {
    setEmpFridayWorked({});
    setEmployeeData((prev) => {
      const copy = { ...prev };
      selectedEmployees.forEach(
        (id) =>
          (copy[id] = {
            ...(copy[id] ?? seedState()),
            workingDays: daysInMonth,
          })
      );
      return copy;
    });
    selectedEmployees.forEach(initFridayMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // fetch advances (available) per selected employee/month
  useEffect(() => {
    const load = async () => {
      await Promise.all(
        selectedEmployees.map(async (id) => {
          try {
            const res = await fetch(
              `/api/employees/${encodeURIComponent(
                id
              )}/advances/summary?year=${selectedYear}&month=${selectedMonth}`,
              { cache: "no-store" }
            );
            const j = await res.json();
            const avail = Number(j?.total || 0);
            setEmployeeData((prev) => ({
              ...prev,
              [id]: {
                ...(prev[id] ?? seedState()),
                advanceAvailable: avail,
                // default: fully deduct available (user can change)
                advanceDeduct: Math.min(
                  avail,
                  prev[id]?.advanceDeduct ?? avail
                ),
              },
            }));
          } catch {
            // leave advanceAvailable=0, advanceDeduct=0 on error
          }
        })
      );
    };
    if (selectedEmployees.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployees.length, selectedMonth, selectedYear]);

  const handleEmployeeSelect = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
      setEmployeeData((prev) => ({
        ...prev,
        [employeeId]: prev[employeeId] ?? seedState(),
      }));
      initFridayMap(employeeId);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
      setEmployeeData((prev) => {
        const copy = { ...prev };
        delete copy[employeeId];
        return copy;
      });
      setEmpFridayWorked((prev) => {
        const copy = { ...prev };
        delete copy[employeeId];
        return copy;
      });
    }
  };

  const toggleFridayWorked = (
    employeeId: string,
    dayNum: number,
    worked: boolean
  ) => {
    setEmpFridayWorked((prev) => {
      const row = { ...(prev[employeeId] ?? {}) };
      row[dayNum] = worked;
      const workedCount = Object.values(row).filter(Boolean).length;
      setEmployeeData((prevED) => ({
        ...prevED,
        [employeeId]: {
          ...(prevED[employeeId] ?? seedState()),
          fridayDays: workedCount,
          fridayLeaves: Math.max(0, fridayNumbers.length - workedCount),
        },
      }));
      return { ...prev, [employeeId]: row };
    });
  };

  const setAllFridays = (employeeId: string, worked: boolean) => {
    const row: Record<number, boolean> = {};
    fridayNumbers.forEach((d) => (row[d] = worked));
    const workedCount = worked ? fridayNumbers.length : 0;
    setEmpFridayWorked((prev) => ({ ...prev, [employeeId]: row }));
    setEmployeeData((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] ?? seedState()),
        fridayDays: workedCount,
        fridayLeaves: fridayNumbers.length - workedCount,
      },
    }));
  };

  // salary math (NO holidays)
  const calcTotal = (employee: any) => {
    const d = employeeData[employee.id];
    const base = Number(employee?.salary || 0);
    if (!d || !base) return 0;

    const { normalDay, fridayDay } = calculateDailySalary(
      base,
      selectedMonth,
      selectedYear
    ); // fridayDay should be normalDay * 2.5
    const normalBase = Math.max(0, d.workingDays - d.fridayDays);
    const normalWorked = Math.max(0, normalBase - d.normalLeaves);
    const fridaysWorked = Math.max(0, d.fridayDays - d.fridayLeaves);

    const workPay = normalWorked * normalDay + fridaysWorked * fridayDay;
    const gross = workPay + Number(d.bonus || 0);
    const net =
      gross -
      Math.min(Number(d.advanceDeduct || 0), Number(d.advanceAvailable || 0));
    return Math.max(0, Math.round(net));
  };

  const handleCalculateAll = () => {
    const rows: SalaryCalculation[] = selectedEmployees.map((id) => {
      const e = employees.find((x) => x.id === id)!;
      const d = employeeData[id] ?? seedState();
      return {
        id: `${Date.now()}_${id}`,
        employeeId: id,
        month: selectedMonth,
        year: selectedYear,
        baseSalary: Number(e.salary || 0),
        workingDays: d.workingDays,
        fridayDays: d.fridayDays,
        normalLeaves: d.normalLeaves,
        fridayLeaves: d.fridayLeaves,
        holidays: 0,
        bonus: d.bonus,
        advance: Math.min(d.advanceDeduct, d.advanceAvailable),
        totalSalary: calcTotal(e),
      };
    });
    onCalculate(rows);
  };

  const totalAll = selectedEmployees.reduce((sum, id) => {
    const e = employees.find((x) => x.id === id);
    return sum + (e ? calcTotal(e) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Period */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Calculation Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2024, i).toLocaleDateString("en-US", {
                        month: "long",
                      })}
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
                onChange={(e) => setSelectedYear(Number(e.target.value || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label>Month Info</Label>
              <div className="text-sm text-muted-foreground">
                <p>Total Days: {daysInMonth}</p>
                <p>Fridays: {fridaysInMonth}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Select Employees */}
      <Card>
        <CardHeader>
          <CardTitle>
            Select Employees ({selectedEmployees.length} selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fixedSalaryEmployees.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No employees with fixed salaries found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedSalaryEmployees.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    checked={selectedEmployees.includes(e.id)}
                    onCheckedChange={(ck) =>
                      handleEmployeeSelect(e.id, ck === true)
                    }
                  />
                  <div className="flex-1">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.empCode ?? e.empId}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Rs. {Number(e.salary).toLocaleString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee rows (Fridays + inputs + advances) */}
      {selectedEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Salary Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedEmployees.map((id) => {
                const e: any = employees.find((x) => x.id === id)!;
                const d = employeeData[id] ?? seedState();
                const fridayRow = empFridayWorked[id] ?? {};
                const total = calcTotal(e);

                return (
                  <div key={id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{e.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {(e.empCode ?? e.empId) || ""} • Rs.{" "}
                          {Number(e.salary).toLocaleString()} / month
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-lg font-semibold"
                      >
                        Rs. {Number(total).toLocaleString()}
                      </Badge>
                    </div>

                    {/* Friday toggles */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Fridays (worked?)</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAllFridays(id, true)}
                          >
                            All worked
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAllFridays(id, false)}
                          >
                            All leave
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {fridayNumbers.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No Fridays this month.
                          </div>
                        ) : (
                          fridayNumbers.map((dayNum) => (
                            <label
                              key={`fri-${id}-${dayNum}`}
                              className="flex items-center gap-3 p-2 border rounded-md"
                            >
                              <Checkbox
                                checked={!!fridayRow[dayNum]}
                                onCheckedChange={(ck) =>
                                  toggleFridayWorked(id, dayNum, ck === true)
                                }
                              />
                              <span>
                                {new Date(
                                  selectedYear,
                                  selectedMonth - 1,
                                  dayNum
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Numbers + advances */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      <Field
                        label="Working Days"
                        value={d.workingDays}
                        onChange={(v) =>
                          setEmployeeData((prev) => ({
                            ...prev,
                            [id]: {
                              ...(prev[id] ?? seedState()),
                              workingDays: Math.min(
                                Math.max(0, v),
                                daysInMonth
                              ),
                            },
                          }))
                        }
                        min={0}
                        max={daysInMonth}
                      />
                      <Field
                        label="Friday Days"
                        value={d.fridayDays}
                        onChange={() => {}}
                        readOnly
                      />
                      <Field
                        label="Normal Leaves"
                        value={d.normalLeaves}
                        onChange={(v) =>
                          setEmployeeData((prev) => ({
                            ...prev,
                            [id]: {
                              ...(prev[id] ?? seedState()),
                              normalLeaves: Math.max(0, v),
                            },
                          }))
                        }
                        min={0}
                      />
                      <Field
                        label="Friday Leaves"
                        value={d.fridayLeaves}
                        onChange={() => {}}
                        readOnly
                      />
                      <FieldMoney
                        label="Bonus"
                        value={d.bonus}
                        onChange={(v) =>
                          setEmployeeData((prev) => ({
                            ...prev,
                            [id]: {
                              ...(prev[id] ?? seedState()),
                              bonus: Math.max(0, v),
                            },
                          }))
                        }
                      />
                      <FieldMoney
                        label={`Advance to deduct (max Rs. ${Number(
                          d.advanceAvailable
                        ).toLocaleString()})`}
                        value={d.advanceDeduct}
                        onChange={(v) =>
                          setEmployeeData((prev) => ({
                            ...prev,
                            [id]: {
                              ...(prev[id] ?? seedState()),
                              advanceDeduct: Math.min(
                                Math.max(0, v),
                                prev[id]?.advanceAvailable ?? 0
                              ),
                            },
                          }))
                        }
                      />
                      <div className="space-y-1">
                        <Label className="text-xs">Deduct fully?</Label>
                        <div className="h-8 flex items-center gap-2 px-2 border rounded-md">
                          <Checkbox
                            checked={
                              d.advanceDeduct >= d.advanceAvailable &&
                              d.advanceAvailable > 0
                            }
                            onCheckedChange={(ck) =>
                              setEmployeeData((prev) => ({
                                ...prev,
                                [id]: {
                                  ...(prev[id] ?? seedState()),
                                  advanceDeduct: ck
                                    ? prev[id]?.advanceAvailable ?? 0
                                    : 0,
                                },
                              }))
                            }
                          />
                          <span className="text-sm">
                            Use full available advance
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Available this month: Rs.{" "}
                          {Number(d.advanceAvailable).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary + Save */}
      {selectedEmployees.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Total Salary Amount</p>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployees.length} employees •{" "}
                  {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" }
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  Rs. {Number(totalAll).toLocaleString()}
                </p>
                <Button
                  onClick={handleCalculateAll}
                  disabled={isLoading}
                  className="mt-2"
                >
                  {isLoading ? "Processing..." : "Calculate & Save Salaries"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* tiny inputs */
function Field({
  label,
  value,
  onChange,
  min,
  max,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={String(value)}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="h-8"
        readOnly={readOnly}
      />
    </div>
  );
}

function FieldMoney({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="h-8"
        readOnly={readOnly}
      />
    </div>
  );
}
