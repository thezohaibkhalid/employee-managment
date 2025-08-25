// app/employees/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { PrimaryPopup } from "../../components/ui/primary-popup";
import { EmployeeForm } from "../../components/employees/employee-form";
import { EmployeeList } from "../../components/employees/employee-list";
import { Plus } from "lucide-react";
import type { EmployeeFormData } from "../../lib/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // small fetch helpers
  const apiEmployees = {
    async list() {
      const res = await fetch("/api/employees", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load employees");
      return data;
    },
    async create(payload: any) {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add employee");
      return data;
    },
    async update(id: string, payload: any) {
      const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update employee");
      return data;
    },
    async remove(id: string) {
      const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete employee");
      return data;
    },
  };

  const apiDesignations = {
    async list() {
      const res = await fetch("/api/designations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to load designations");
      return data;
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesData, designationsData] = await Promise.all([
          apiEmployees.list(),
          apiDesignations.list(),
        ]);
        setEmployees(employeesData || []);
        setDesignations(designationsData || []);
      } catch (err: any) {
        console.error("Error fetching employees data:", err);
        setError(err?.message || "Failed to load employees data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLastEmpNumber = () => {
    if (employees.length === 0) return 0;
    const empNumbers = employees.map((emp: any) => emp.empNumber || 0);
    return Math.max(...empNumbers);
  };

  const handleAddEmployee = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      await apiEmployees.create({
        name: data.name,
        fatherName: data.fatherName,
        dob: data.dob,
        cnic: data.cnic,
        phone: data.phone,
        address: data.address,
        designationId: data.designationId,
        fixedMonthlySalary: data.fixedMonthlySalary,
        caste: data.caste,
        city: data.city,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        referenceName: data.referenceName,
        referencePhone: data.referencePhone,
        referenceRelation: data.referenceRelation,
        contactPersonName: data.contactPersonName,
        contactPersonNumber: data.contactPersonNumber,
        contactPersonRelation: data.contactPersonRelation,
      });

      const updatedEmployees = await apiEmployees.list();
      setEmployees(updatedEmployees || []);
      setIsAddingEmployee(false);
    } catch (error: any) {
      console.error("Error adding employee:", error);
      alert(`Failed to add employee: ${error.message || "Please try again."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = async (id: string, data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      await apiEmployees.update(id, {
        name: data.name,
        fatherName: data.fatherName,
        dob: data.dob,
        cnic: data.cnic,
        phone: data.phone,
        address: data.address,
        designationId: data.designationId,
        fixedMonthlySalary: data.fixedMonthlySalary,
        caste: data.caste,
        city: data.city,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        referenceName: data.referenceName,
        referencePhone: data.referencePhone,
        referenceRelation: data.referenceRelation,
        contactPersonName: data.contactPersonName,
        contactPersonNumber: data.contactPersonNumber,
        contactPersonRelation: data.contactPersonRelation,
      });

      const updatedEmployees = await apiEmployees.list();
      setEmployees(updatedEmployees || []);
    } catch (error: any) {
      console.error("Error editing employee:", error);
      alert(
        `Failed to update employee: ${error.message || "Please try again."}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    setIsLoading(true);
    try {
      await apiEmployees.remove(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
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
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage employee information, salaries, and records
          </p>
        </div>

        <PrimaryPopup
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          }
          title="Add New Employee"
          open={isAddingEmployee}
          onOpenChange={setIsAddingEmployee}
        >
          <EmployeeForm
            onSubmit={handleAddEmployee}
            onCancel={() => setIsAddingEmployee(false)}
            designations={designations}
            lastEmpNumber={getLastEmpNumber()}
            isLoading={isLoading}
          />
        </PrimaryPopup>
      </div>

      <EmployeeList
        employees={employees}
        designations={designations}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        isLoading={isLoading}
      />
    </div>
  );
}
