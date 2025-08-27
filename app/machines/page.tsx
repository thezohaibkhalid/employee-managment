// app/machines/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { PrimaryPopup } from "../../components/ui/primary-popup";
import { MachineForm } from "../../components/machines/machine-form";
import { MachineList } from "../../components/machines/machine-list";
import { Plus, ChevronDown, ChevronRight, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import type {
  MachineFormData,
  BonusUploadData,
  SalaryUploadData,
  Machine,
} from "../../lib/types";
import type { MachineType } from "@prisma/client";

type RatesMeta = { bonusCount: number; salaryCount: number };

type UISalaryRate = {
  designation: string;
  monthlySalary: number;
  dailyRate: number;
  isVariable: boolean;
};

type UIBonusTier = {
  minStitches: number;
  rateTwoHead: number;
  rateSheet: number;
};

type RateBundle = {
  loaded: boolean;
  loading: boolean;
  salary: UISalaryRate[];
  bonus: UIBonusTier[];
  error?: string;
};

function deserializeMachine(raw: any): Machine {
  return {
    id: raw.id,
    name: raw.name,
    machineType: raw.machineType,
    company: { id: raw.company?.id, name: raw.company?.name },
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [ratesMeta, setRatesMeta] = useState<Record<string, RatesMeta>>({});
  const [ratesByMachine, setRatesByMachine] = useState<
    Record<string, RateBundle>
  >({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load machines
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/machines", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load machines");
        const rows = (data || []).map(deserializeMachine);
        setMachines(rows);
        const init: Record<string, RateBundle> = {};
        rows.forEach((m) => {
          init[m.id] = { loaded: false, loading: false, salary: [], bonus: [] };
        });
        setRatesByMachine(init);
      } catch (err) {
        console.error("Error fetching machines:", err);
        setError("Failed to load machines");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Prefetch just counts
  useEffect(() => {
    if (!machines.length) return;
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        machines.map(async (m) => {
          try {
            const r = await fetch(`/api/machines/${m.id}/rates`, {
              cache: "no-store",
            });
            const j = await r.json();
            return [
              m.id,
              {
                bonusCount: j?.bonusRates?.length ?? 0,
                salaryCount: j?.salaryRates?.length ?? 0,
              } as RatesMeta,
            ] as const;
          } catch {
            return [
              m.id,
              { bonusCount: 0, salaryCount: 0 } as RatesMeta,
            ] as const;
          }
        })
      );
      if (!cancelled) setRatesMeta(Object.fromEntries(pairs));
    })();
    return () => {
      cancelled = true;
    };
  }, [machines]);

  const dailyFromMonthly = (monthly: number) =>
    Math.round((Number(monthly) / 30) * 100) / 100;

  const fetchRates = async (machineId: string) => {
    setRatesByMachine((prev) => ({
      ...prev,
      [machineId]: { ...prev[machineId], loading: true, error: undefined },
    }));
    try {
      const res = await fetch(`/api/machines/${machineId}/rates`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to fetch rates");

      const salary: UISalaryRate[] = (j.salaryRates || [])
        .map((r: any) => {
          const name = r.designation?.name ?? "";
          const monthly = Number(r.monthlySalary ?? 0);
          return {
            designation: name,
            monthlySalary: monthly,
            dailyRate: dailyFromMonthly(monthly),
            isVariable: !!r.designation?.isVariablePay,
          };
        })
        .sort((a, b) => {
          const rank = (d: string) =>
            d.toLowerCase() === "operator"
              ? 1
              : d.toLowerCase() === "karigar"
              ? 2
              : d.toLowerCase() === "helper"
              ? 3
              : 99;
          return rank(a.designation) - rank(b.designation);
        });

      const bonus: UIBonusTier[] = (j.bonusRates || [])
        .map((b: any) => ({
          minStitches: Number(b.minStitches ?? 0),
          rateTwoHead: Number(b.rateTwoHead ?? 0),
          rateSheet: Number(b.rateSheet ?? 0),
        }))
        .sort((a, b) => a.minStitches - b.minStitches);

      setRatesByMachine((prev) => ({
        ...prev,
        [machineId]: { loaded: true, loading: false, salary, bonus },
      }));

      setRatesMeta((prev) => ({
        ...prev,
        [machineId]: { bonusCount: bonus.length, salaryCount: salary.length },
      }));
    } catch (e: any) {
      console.error("Fetch rates error", e);
      setRatesByMachine((prev) => ({
        ...prev,
        [machineId]: {
          ...prev[machineId],
          loading: false,
          loaded: true,
          error: e?.message || "Failed to load rates",
        },
      }));
    }
  };

  const toggleOpen = async (id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    const bundle = ratesByMachine[id];
    if (bundle && !bundle.loaded && !bundle.loading) {
      await fetchRates(id);
    }
  };

  // Create
  const handleAddMachine = async (data: MachineFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          companyName: data.company,
          machineType: data.type,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create machine");
      const created = deserializeMachine(json);
      setMachines((prev) => [created, ...prev]);
      setRatesByMachine((prev) => ({
        ...prev,
        [created.id]: { loaded: false, loading: false, salary: [], bonus: [] },
      }));
      setIsAddingMachine(false);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to add machine.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update
  const handleEditMachine = async (id: string, data: MachineFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/machines/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          companyName: data.company,
          machineType: data.type,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update machine");
      const updated = deserializeMachine(json);
      setMachines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to update machine.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete
  const handleDeleteMachine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this machine?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/machines/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete machine");
      setMachines((prev) => prev.filter((m) => m.id !== id));
      setRatesMeta((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setRatesByMachine((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to delete machine.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔁 BONUS UPLOAD — by MachineType (CSV or manual)
  const handleUploadBonus = async (
    machineType: MachineType,
    data: BonusUploadData
  ) => {
    setIsLoading(true);
    try {
      // Normalize to { bonusType: "2 head"|"sheet", rate, stitchCount }[]
      let bonusRatesToUpload:
        | { bonusType: "2 head" | "sheet"; rate: number; stitchCount: number }[]
        | null = null;

      if (
        Array.isArray((data as any).bonusRates) &&
        (data as any).bonusRates.length
      ) {
        const first = (data as any).bonusRates[0];
        // CSV-like shape detection
        if (
          "num_of_stiches" in first ||
          "num_of_stitches" in first ||
          ("2 head" in first && "sheet" in first)
        ) {
          const normalize = (rows: any[]) =>
            rows.flatMap((r) => {
              const stitchCount =
                Number(
                  r.num_of_stiches ?? r.num_of_stitches ?? r.stitchCount ?? 0
                ) || 0;
              const out: any[] = [];
              if (
                r["2 head"] != null &&
                r["2 head"] !== "" &&
                !Number.isNaN(Number(r["2 head"]))
              ) {
                out.push({
                  bonusType: "2 head",
                  rate: Number(r["2 head"]),
                  stitchCount,
                });
              }
              if (
                r["sheet"] != null &&
                r["sheet"] !== "" &&
                !Number.isNaN(Number(r["sheet"]))
              ) {
                out.push({
                  bonusType: "sheet",
                  rate: Number(r["sheet"]),
                  stitchCount,
                });
              }
              return out;
            });
          bonusRatesToUpload = normalize((data as any).bonusRates);
        } else {
          // Already normalized
          bonusRatesToUpload = (data as any).bonusRates.map((r: any) => ({
            bonusType: (r.bonusType === "2 head" ? "2 head" : "sheet") as
              | "2 head"
              | "sheet",
            rate: Number(r.rate),
            stitchCount: Number(r.stitchCount ?? 0),
          }));
        }
      } else {
        // Manual single-line (flat) fallback
        const rows: {
          bonusType: "2 head" | "sheet";
          rate: number;
          stitchCount: number;
        }[] = [];
        if ((data as any)["2 head"])
          rows.push({
            bonusType: "2 head",
            rate: Number((data as any)["2 head"]),
            stitchCount: 0,
          });
        if ((data as any).sheet)
          rows.push({
            bonusType: "sheet",
            rate: Number((data as any).sheet),
            stitchCount: 0,
          });
        bonusRatesToUpload = rows;
      }

      if (!bonusRatesToUpload?.length) {
        alert("No bonus rates to upload.");
        return;
      }

      // PUT to machine-type API
      const res = await fetch(
        `/api/machine-types/${encodeURIComponent(machineType)}/bonus`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bonusRates: bonusRatesToUpload }),
        }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to update bonus rates");

      // Refresh all machines of this type currently opened
      const affected = machines.filter((m) => m.machineType === machineType);
      await Promise.all(affected.map((m) => fetchRates(m.id)));

      alert("Bonus rates updated successfully!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to update bonus rates.");
    } finally {
      setIsLoading(false);
    }
  };

  // SALARY (by MachineType)
  const handleSaveSalary = async (
    machineType: MachineType,
    data?: SalaryUploadData
  ) => {
    setIsLoading(true);
    try {
      const anyData = (data ?? {}) as any;
      const rows = (anyData.salaryRates ?? anyData.rows ?? []) as {
        designation: string;
        dailyRate: number;
      }[];
      if (!Array.isArray(rows) || rows.length === 0) {
        alert("No salary rates to save");
        return;
      }

      const res = await fetch(
        `/api/machine-types/${encodeURIComponent(machineType)}/salary`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: rows.map((r) => ({
              designation: r.designation,
              dailyRate: Number(r.dailyRate),
            })),
          }),
        }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to update salary rates");

      const affected = machines.filter((m) => m.machineType === machineType);
      await Promise.all(affected.map((m) => fetchRates(m.id)));

      alert("Salary rates updated successfully!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to update salary rates.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickCards = useMemo(
    () =>
      machines.map((m) => ({
        id: m.id,
        name: m.name,
        company: m.company?.name || "—",
        machineType: m.machineType,
        createdOn: m.createdAt ? m.createdAt.toLocaleDateString() : "",
        meta: ratesMeta[m.id] || { bonusCount: 0, salaryCount: 0 },
      })),
    [machines, ratesMeta]
  );

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Machine Management</h1>
          <p className="text-muted-foreground">
            See configured salary rates (operator / karigar / helper) and bonus
            tiers. Manage machines and upload rates.
          </p>
        </div>

        <PrimaryPopup
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Machine
            </Button>
          }
          title="Add New Machine"
          open={isAddingMachine}
          onOpenChange={setIsAddingMachine}
        >
          <MachineForm
            onSubmit={handleAddMachine}
            onCancel={() => setIsAddingMachine(false)}
            isLoading={isLoading}
          />
        </PrimaryPopup>
      </div>

      {/* Quick Glance */}
      {!!quickCards.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {quickCards.map((m) => {
            const isOpen = !!open[m.id];
            const bundle = ratesByMachine[m.id];
            const Icon = isOpen ? ChevronDown : ChevronRight;
            return (
              <Card key={m.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 rounded hover:bg-muted"
                        onClick={() => toggleOpen(m.id)}
                        title={isOpen ? "Collapse" : "Expand"}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.company}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{m.machineType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {m.createdOn}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                      {m.meta.salaryCount} salary rates
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">
                      {m.meta.bonusCount} bonus tiers
                    </span>
                    {bundle?.loaded && (
                      <button
                        className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => fetchRates(m.id)}
                        title="Refresh rates"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Refresh
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-4">
                      {/* Salary table */}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Salary Rates
                        </div>
                        {!bundle?.loaded && (
                          <div className="text-xs text-muted-foreground">
                            Loading…
                          </div>
                        )}
                        {bundle?.loaded && bundle?.salary?.length === 0 && (
                          <div className="text-xs text-muted-foreground">
                            No salary rates set yet.
                          </div>
                        )}
                        {bundle?.loaded && bundle?.salary?.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border rounded">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2">Designation</th>
                                  <th className="text-right p-2">Daily Rate</th>
                                  <th className="text-right p-2">
                                    Monthly Salary
                                  </th>
                                  <th className="text-center p-2">
                                    Variable Pay
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {bundle.salary.map((s, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2 capitalize">
                                      {s.designation}
                                    </td>
                                    <td className="p-2 text-right">
                                      Rs. {s.dailyRate.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right">
                                      Rs. {s.monthlySalary.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-center">
                                      {s.isVariable ? (
                                        <Badge variant="outline">Yes</Badge>
                                      ) : (
                                        <Badge variant="secondary">No</Badge>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Bonus table */}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Bonus Tiers (flat amounts)
                        </div>
                        {!bundle?.loaded && (
                          <div className="text-xs text-muted-foreground">
                            Loading…
                          </div>
                        )}
                        {bundle?.loaded && bundle?.bonus?.length === 0 && (
                          <div className="text-xs text-muted-foreground">
                            No bonus tiers set yet.
                          </div>
                        )}
                        {bundle?.loaded && bundle?.bonus?.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border rounded">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2">
                                    From Stitches
                                  </th>
                                  <th className="text-right p-2">2 head</th>
                                  <th className="text-right p-2">Sheet</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bundle.bonus.map((b, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2">
                                      {b.minStitches.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-right">
                                      {b.rateTwoHead}
                                    </td>
                                    <td className="p-2 text-right">
                                      {b.rateSheet}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {bundle?.error && (
                        <div className="text-xs text-red-600">
                          Error: {bundle.error}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MachineList
        machines={machines}
        onEdit={handleEditMachine}
        onDelete={handleDeleteMachine}
        onUploadBonus={handleUploadBonus}
        onSaveSalary={handleSaveSalary}
        isLoading={isLoading}
      />
    </div>
  );
}
