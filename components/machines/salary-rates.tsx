"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Upload, FileText } from "lucide-react";
import { WORKER_DESIGNATIONS, MACHINE_TYPE_LABELS } from "../../lib/constants";
import type { SalaryUploadData, MachineType } from "../../lib/types";

interface SalaryRatesProps {
  machineId: string;
  machineType: MachineType;
  onSave: (data: SalaryUploadData) => void;
  initialData?: SalaryUploadData;
  isLoading?: boolean;
}

export function SalaryRates({
  machineId,
  machineType,
  onSave,
  initialData,
  isLoading,
}: SalaryRatesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"csv" | "manual">("manual");
  const [salaryData, setSalaryData] = useState<SalaryUploadData>(
    initialData || {
      operator: 0,
      karigar: 0,
      helper: 0,
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      alert("Please select a valid CSV file");
    }
  };

  const handleCSVUpload = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        alert("CSV file must contain at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      console.log(" CSV Headers:", headers);

      const salaryRates: Array<{
        designation: "operator" | "karigar" | "helper";
        dailyRate: number;
      }> = [];

      // Skip header row and process data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());

        if (values.length >= 2) {
          const designation = values[0].toLowerCase();
          const dailyRate = Number.parseFloat(values[1]) || 0;

          if (
            WORKER_DESIGNATIONS.includes(designation as any) &&
            dailyRate > 0
          ) {
            salaryRates.push({
              designation: designation as "operator" | "karigar" | "helper",
              dailyRate,
            });
          }
        }
      }

      console.log(" Parsed salary rates:", salaryRates);

      if (salaryRates.length === 0) {
        alert("No valid salary rates found in CSV file");
        return;
      }

      const data: SalaryUploadData = { salaryRates };
      onSave(data);
    } catch (error) {
      console.error(" Error parsing CSV:", error);
      alert("Error parsing CSV file. Please check the format.");
    }
  };

  const handleManualSubmit = () => {
    const salaryRates = WORKER_DESIGNATIONS.map((designation) => ({
      designation,
      dailyRate: salaryData[designation] || 0,
    })).filter((rate) => rate.dailyRate > 0);

    if (salaryRates.length === 0) {
      alert("Please enter at least one salary rate");
      return;
    }

    const data: SalaryUploadData = { salaryRates };
    onSave(data);
  };

  const handleChange = (designation: keyof SalaryUploadData, value: number) => {
    setSalaryData((prev) => ({ ...prev, [designation]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Daily Salary Rates - {MACHINE_TYPE_LABELS[machineType]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={uploadMethod === "manual" ? "default" : "outline"}
            onClick={() => setUploadMethod("manual")}
            size="sm"
          >
            Manual Entry
          </Button>
          <Button
            variant={uploadMethod === "csv" ? "default" : "outline"}
            onClick={() => setUploadMethod("csv")}
            size="sm"
          >
            CSV Upload
          </Button>
        </div>

        {uploadMethod === "csv" ? (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV file with columns:{" "}
                <strong>designation, daily_rate</strong>. Valid designations
                are: operator, karigar, helper.
                <br />
                <span className="text-xs mt-1 block">
                  Example: operator,1500 (operator gets Rs.1500 per day)
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleCSVUpload}
              disabled={!file || isLoading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Uploading..." : "Upload CSV"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Enter daily salary rates for {MACHINE_TYPE_LABELS[machineType]}{" "}
                workers. These rates will be used for payroll calculations.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WORKER_DESIGNATIONS.map((designation) => (
                <div key={designation} className="space-y-2">
                  <Label htmlFor={designation} className="capitalize">
                    {designation} Daily Rate (Rs.)
                  </Label>
                  <Input
                    id={designation}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={salaryData[designation] || ""}
                    onChange={(e) =>
                      handleChange(
                        designation,
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleManualSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Salary Rates"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
