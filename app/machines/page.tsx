"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { PrimaryPopup } from "../../components/ui/primary-popup";
import { MachineForm } from "../../components/machines/machine-form";
import { MachineList } from "../../components/machines/machine-list";
import { Plus } from "lucide-react";
import type {
  MachineFormData,
  BonusUploadData,
  SalaryUploadData,
} from "../../lib/types";

export default function MachinesPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/machines", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load machines");
        setMachines(data || []);
      } catch (err) {
        console.error("Error fetching machines:", err);
        setError("Failed to load machines");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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
      const newMachine = await res.json();
      if (!res.ok)
        throw new Error(newMachine.error || "Failed to create machine");
      setMachines((prev) => [newMachine, ...prev]);
      setIsAddingMachine(false);
    } catch (error: any) {
      console.error("Error adding machine:", error);
      alert(error.message || "Failed to add machine.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Update
  const handleEditMachine = async (id: string, data: MachineFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/machines?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          companyName: data.company,
          machineType: data.type,
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to update machine");
      setMachines((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (error: any) {
      console.error("Error editing machine:", error);
      alert(error.message || "Failed to update machine.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Delete
  const handleDeleteMachine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this machine?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/machines?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete machine");
      setMachines((prev) => prev.filter((m) => m.id !== id));
    } catch (error: any) {
      console.error("Error deleting machine:", error);
      alert(error.message || "Failed to delete machine.");
    } finally {
      setIsLoading(false);
    }
  };

  // 📈 Bonus upload → calls API (server uses your existing function)
  const handleUploadBonus = async (
    machineId: string,
    data: BonusUploadData
  ) => {
    setIsLoading(true);
    try {
      let bonusRatesToUpload: {
        bonusType: string;
        rate: number;
        stitchCount: number;
      }[] = [];

      if (data.bonusRates?.length) {
        bonusRatesToUpload = data.bonusRates.map((r) => ({
          bonusType: r.bonusType,
          rate: r.rate,
          stitchCount: r.stitchCount,
        }));
      } else {
        if (data.stitch)
          bonusRatesToUpload.push({
            bonusType: "stitch",
            rate: data.stitch,
            stitchCount: 0,
          });
        if (data["2 head"])
          bonusRatesToUpload.push({
            bonusType: "2 head",
            rate: data["2 head"],
            stitchCount: 0,
          });
        if (data.sheet)
          bonusRatesToUpload.push({
            bonusType: "sheet",
            rate: data.sheet,
            stitchCount: 0,
          });
      }

      const res = await fetch(
        `/api/machines/${encodeURIComponent(machineId)}/bonus`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bonusRates: bonusRatesToUpload }),
        }
      );
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to update bonus rates");

      alert("Bonus rates updated successfully!");
    } catch (error: any) {
      console.error("Error uploading bonus:", error);
      alert(error.message || "Failed to update bonus rates.");
    } finally {
      setIsLoading(false);
    }
  };

  // 💵 Salary save → calls API (server uses your existing function)
  const handleSaveSalary = async (
    machineId: string,
    data: SalaryUploadData
  ) => {
    setIsLoading(true);
    try {
      if (!data.salaryRates?.length) {
        alert("No salary rates to save");
        return;
      }

      const res = await fetch(
        `/api/machines/${encodeURIComponent(machineId)}/salary`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salaryRates: data.salaryRates.map((r) => ({
              designation: r.designation,
              dailyRate: r.dailyRate,
            })),
          }),
        }
      );
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to update salary rates");

      alert("Salary rates updated successfully!");
    } catch (error: any) {
      console.error("Error saving salary rates:", error);
      alert(error.message || "Failed to update salary rates.");
    } finally {
      setIsLoading(false);
    }
  };

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
            Manage your machines, bonus rates, and salary configurations
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
