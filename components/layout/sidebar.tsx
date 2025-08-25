"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Factory, Users, UserCog, Calculator, TrendingUp, Home, Menu, X } from "lucide-react"
import { cn } from "../../lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and statistics",
  },
  {
    name: "Machines",
    href: "/machines",
    icon: Factory,
    description: "Manage machines and rates",
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
    description: "Employee management",
  },
  {
    name: "Employee Types",
    href: "/employee-types",
    icon: UserCog,
    description: "Manage designations",
  },
  {
    name: "Salary Calculation",
    href: "/salary-calculation",
    icon: Calculator,
    description: "Fixed salary calculations",
  },
  {
    name: "Bonus & Salary",
    href: "/bonus-salary-calculation",
    icon: TrendingUp,
    description: "Production-based calculations",
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">Manufacturing System</h1>
            <p className="text-sm text-muted-foreground">Production Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                  <Card
                    className={cn(
                      "p-3 cursor-pointer transition-colors hover:bg-accent",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p>Manufacturing Management System</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
