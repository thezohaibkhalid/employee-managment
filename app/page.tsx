"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "../components/dashboard/stats-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Factory,
  Users,
  Calculator,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getMachines } from "@/lib/api/machines";
import { getEmployees } from "@/lib/api/employees";

export default function DashboardPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [machinesData, employeesData] = await Promise.all([
          getMachines(),
          getEmployees(),
        ]);
        setMachines(machinesData || []);
        setEmployees(employeesData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const fixedSalaryEmployees = employees.filter(
    (emp) => emp.employee_types?.has_fixed_salary
  );
  const variableSalaryEmployees = employees.filter(
    (emp) => !emp.employee_types?.has_fixed_salary
  );

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const quickActions = [
    {
      title: "Add Machine",
      description: "Register a new machine",
      href: "/machines",
      icon: Factory,
      color: "bg-blue-500",
    },
    {
      title: "Add Employee",
      description: "Register a new employee",
      href: "/employees",
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Calculate Salary",
      description: "Process monthly salaries",
      href: "/salary-calculation",
      icon: Calculator,
      color: "bg-purple-500",
    },
    {
      title: "Production Bonus",
      description: "Calculate production bonuses",
      href: "/bonus-salary-calculation",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manufacturing Management System Overview
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {currentMonth}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Machines"
          value={machines.length}
          description="Active production machines"
          icon={Factory}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Employees"
          value={employees.length}
          description="Registered employees"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Fixed Salary"
          value={fixedSalaryEmployees.length}
          description="Monthly salary employees"
          icon={Calculator}
        />
        <StatsCard
          title="Production Workers"
          value={variableSalaryEmployees.length}
          description="Bonus-based employees"
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="cursor-pointer transition-colors hover:bg-accent">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{action.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Machine Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {machines.slice(0, 3).map((machine) => (
                <div
                  key={machine.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{machine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {machine.company}
                    </p>
                  </div>
                  <Badge variant="secondary">{machine.type}</Badge>
                </div>
              ))}
              <Link href="/machines">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Machines
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.slice(0, 3).map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.empId}
                    </p>
                  </div>
                  <Badge variant="outline">{employee.designation.name}</Badge>
                </div>
              ))}
              <Link href="/employees">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Employees
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Machine Management</p>
                <p className="text-sm text-muted-foreground">
                  All systems operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Employee System</p>
                <p className="text-sm text-muted-foreground">
                  All systems operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Salary Calculations</p>
                <p className="text-sm text-muted-foreground">
                  Ready for processing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
