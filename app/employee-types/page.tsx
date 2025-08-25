"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { PrimaryPopup } from "../../components/ui/primary-popup";
import { EmployeeTypeForm } from "../../components/employee-types/employee-type-form";
import { EmployeeTypeList } from "../../components/employee-types/employee-type-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Plus, Info } from "lucide-react";

interface EmployeeTypeFormData {
  name: string;
  hasFixedSalary: boolean;
  notes?: string;
}

type Designation = {
  id: string;
  name: string;
  isVariablePay: boolean;
  notes?: string | null;
  slug?: string | null;
};

export default function EmployeeTypesPage() {
  const [employeeTypes, setEmployeeTypes] = useState<Designation[]>([]);
  const [isAddingType, setIsAddingType] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helpers for API calls
  const api = {
    async list(): Promise<Designation[]> {
      const res = await fetch("/api/designations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to load employee types");
      return data;
    },
    async create(payload: {
      name: string;
      isVariablePay: boolean;
      notes?: string;
    }) {
      const res = await fetch("/api/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to add employee type");
      return data as Designation;
    },
    async update(
      id: string,
      payload: Partial<{ name: string; isVariablePay: boolean; notes?: string }>
    ) {
      const res = await fetch(`/api/designations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to update employee type");
      return data as Designation;
    },
    async remove(id: string) {
      const res = await fetch(`/api/designations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete employee type");
      return data;
    },
  };

  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        setIsLoading(true);
        const data = await api.list();
        setEmployeeTypes(data || []);
      } catch (err: any) {
        console.error("Error fetching employee types:", err);
        setError(err?.message || "Failed to load employee types");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployeeTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddType = async (data: EmployeeTypeFormData) => {
    setIsLoading(true);
    try {
      const newType = await api.create({
        name: data.name.toLowerCase(),
        isVariablePay: !data.hasFixedSalary,
        notes: data.notes,
      });
      setEmployeeTypes((prev) => [...prev, newType]);
      setIsAddingType(false);
    } catch (error: any) {
      console.error("Error adding employee type:", error);
      alert(error?.message || "Failed to add employee type. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditType = async (id: string, data: EmployeeTypeFormData) => {
    setIsLoading(true);
    try {
      const updatedType = await api.update(id, {
        name: data.name.toLowerCase(),
        isVariablePay: !data.hasFixedSalary,
        notes: data.notes,
      });
      setEmployeeTypes((prev) =>
        prev.map((t) => (t.id === id ? updatedType : t))
      );
    } catch (error: any) {
      console.error("Error editing employee type:", error);
      alert(
        error?.message || "Failed to update employee type. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee type?")) return;
    setIsLoading(true);
    try {
      await api.remove(id);
      setEmployeeTypes((prev) => prev.filter((t) => t.id !== id));
    } catch (error: any) {
      console.error("Error deleting employee type:", error);
      alert(
        error?.message || "Failed to delete employee type. Please try again."
      );
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

  const fixedSalaryTypes = employeeTypes.filter((t) => !t.isVariablePay);
  const variableSalaryTypes = employeeTypes.filter((t) => t.isVariablePay);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employee Types Management</h1>
          <p className="text-muted-foreground">
            Manage employee designations and salary structures
          </p>
        </div>

        <PrimaryPopup
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee Type
            </Button>
          }
          title="Add New Employee Type"
          open={isAddingType}
          onOpenChange={setIsAddingType}
        >
          <EmployeeTypeForm
            onSubmit={handleAddType}
            onCancel={() => setIsAddingType(false)}
            isLoading={isLoading}
          />
        </PrimaryPopup>
      </div>

      {/* Information Card */}
      <Card className="mb-6 border-blue-2 00 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            Employee Type Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Fixed Salary Types:</h4>
              <p>
                Employees with monthly salaries. Their pay is calculated based
                on working days, Friday multipliers, and deductions.
              </p>
              <p className="mt-1 text-xs">
                Examples: Supervisor, Manager, Admin
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Variable Salary Types:</h4>
              <p>
                Workers paid based on production output. Their salary is
                calculated in the Bonus & Salary Calculation section.
              </p>
              <p className="mt-1 text-xs">
                Core Types: Operator, Karigar, Helper
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{employeeTypes.length}</p>
              <p className="text-sm text-muted-foreground">Total Types</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {fixedSalaryTypes.length}
              </p>
              <p className="text-sm text-muted-foreground">Fixed Salary</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {variableSalaryTypes.length}
              </p>
              <p className="text-sm text-muted-foreground">Variable Salary</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployeeTypeList
        employeeTypes={employeeTypes}
        onEdit={handleEditType}
        onDelete={handleDeleteType}
        isLoading={isLoading}
      />
    </div>
  );
}
