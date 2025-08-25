"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { PrimaryPopup } from "../ui/primary-popup"
import { MachineForm } from "./machine-form"
import { BonusUpload } from "./bonus-upload"
import { SalaryRates } from "./salary-rates"
import { Edit, Trash2, Upload, DollarSign } from "lucide-react"
import type { Machine, MachineFormData, BonusUploadData, SalaryUploadData } from "../../lib/types"
import { MACHINE_TYPE_LABELS } from "../../lib/constants"

interface MachineListProps {
  machines: Machine[]
  onEdit: (id: string, data: MachineFormData) => void
  onDelete: (id: string) => void
  onUploadBonus: (machineId: string, data: BonusUploadData) => void
  onSaveSalary: (machineId: string, data: SalaryUploadData) => void
  isLoading?: boolean
}

export function MachineList({ machines, onEdit, onDelete, onUploadBonus, onSaveSalary, isLoading }: MachineListProps) {
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [bonusMachine, setBonusMachine] = useState<Machine | null>(null)
  const [salaryMachine, setSalaryMachine] = useState<Machine | null>(null)

  const handleEdit = (data: MachineFormData) => {
    if (editingMachine) {
      onEdit(editingMachine.id, data)
      setEditingMachine(null)
    }
  }

  const handleBonusUpload = (data: BonusUploadData) => {
    if (bonusMachine) {
      onUploadBonus(bonusMachine.id, data)
      setBonusMachine(null)
    }
  }

  const handleSalarySave = (data: SalaryUploadData) => {
    if (salaryMachine) {
      onSaveSalary(salaryMachine.id, data)
      setSalaryMachine(null)
    }
  }

  if (machines.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No machines added yet. Add your first machine to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {machines.map((machine) => (
        <Card key={machine.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{machine.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{machine.company.name}</p>
              </div>
              <Badge variant="secondary">{MACHINE_TYPE_LABELS[machine.machineType]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setEditingMachine(machine)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>

              <PrimaryPopup
                trigger={
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Bonus
                  </Button>
                }
                title={`Upload Bonus - ${machine.name}`}
                open={bonusMachine?.id === machine.id}
                onOpenChange={(open) => setBonusMachine(open ? machine : null)}
              >
                <BonusUpload
                  machineId={machine.id}
                  machineType={machine.type}
                  onUpload={handleBonusUpload}
                  isLoading={isLoading}
                />
              </PrimaryPopup>

              <PrimaryPopup
                trigger={
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Salary Rates
                  </Button>
                }
                title={`Salary Rates - ${machine.name}`}
                open={salaryMachine?.id === machine.id}
                onOpenChange={(open) => setSalaryMachine(open ? machine : null)}
              >
                <SalaryRates
                  machineId={machine.id}
                  machineType={machine.type}
                  onSave={handleSalarySave}
                  isLoading={isLoading}
                />
              </PrimaryPopup>

              <Button variant="destructive" size="sm" onClick={() => onDelete(machine.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Machine Popup */}
      <PrimaryPopup
        trigger={<div />}
        title="Edit Machine"
        open={!!editingMachine}
        onOpenChange={(open) => !open && setEditingMachine(null)}
      >
        {editingMachine && (
          <MachineForm
            initialData={editingMachine}
            onSubmit={handleEdit}
            onCancel={() => setEditingMachine(null)}
            isLoading={isLoading}
          />
        )}
      </PrimaryPopup>
    </div>
  )
}
