"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { getMachineRates } from "../../lib/api/machines";
import type { Machine, BonusRate, SalaryRate } from "../../lib/types";

interface MachineSelectorProps {
  machines: Machine[];
  selectedMachine: Machine | null;
  onMachineSelect: (machine: Machine) => void;
  bonusRates: BonusRate[];
  salaryRates: SalaryRate[];
  onRatesUpdate?: (bonusRates: BonusRate[], salaryRates: SalaryRate[]) => void;
}

export function MachineSelector({
  machines,
  selectedMachine,
  onMachineSelect,
  bonusRates,
  salaryRates,
  onRatesUpdate,
}: MachineSelectorProps) {
  const handleMachineChange = async (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId);
    if (machine) {
      onMachineSelect(machine);

      if (onRatesUpdate) {
        try {
          const rates = await getMachineRates(machineId);
          onRatesUpdate(rates.bonusRates, rates.salaryRates);
        } catch (error) {
          console.error("Error fetching machine rates:", error);
        }
      }
    }
  };

  const getDisplayRates = (machineId: string) => {
    const bonus = bonusRates.filter(
      (rate) => rate.machineType === selectedMachine?.machineType
    );
    const salary = salaryRates.filter(
      (rate) => rate.machineType === selectedMachine?.machineType
    );
    return { bonus, salary };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Machine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select
            value={selectedMachine?.id || ""}
            onValueChange={handleMachineChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a machine for calculation" />
            </SelectTrigger>
            <SelectContent>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name} - {machine.company.name} ({machine.machineType}
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMachine && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{selectedMachine.name}</h3>
              <Badge variant="secondary">{selectedMachine.machineType}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bonus Rates */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Bonus Rates</h4>
                <div className="space-y-1">
                  {getDisplayRates(selectedMachine.id).bonus.length > 0 ? (
                    getDisplayRates(selectedMachine.id).bonus.map((rate) => (
                      <div
                        key={rate.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          Stitches {rate.minStitches}
                          {rate.maxStitches ? `-${rate.maxStitches}` : "+"}:
                        </span>
                        <div className="text-right">
                          <div>2H: Rs. {rate.rateTwoHead}</div>
                          <div>Sheet: Rs. {rate.rateSheet}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No bonus rates uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Salary Rates */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Monthly Salary Rates</h4>
                <div className="space-y-1">
                  {getDisplayRates(selectedMachine.id).salary.length > 0 ? (
                    getDisplayRates(selectedMachine.id).salary.map((rate) => (
                      <div
                        key={rate.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="capitalize">
                          {rate.designation.name}:
                        </span>
                        <span>
                          Rs. {Number(rate.monthlySalary).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No salary rates uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
