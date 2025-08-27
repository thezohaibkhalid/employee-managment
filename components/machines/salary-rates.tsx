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
import type { MachineType } from "@prisma/client";

type Row = { designation: string; dailyRate: number };

interface SalaryRatesProps {
  machineType: MachineType;
  onSave: (machineType: MachineType, data: { rows: Row[] }) => void;
  initialData?:
    | { rows?: Row[] }
    | { salaryRates?: Row[] }
    | Record<string, number>;
  isLoading?: boolean;
}

export function SalaryRates({
  machineType,
  onSave,
  initialData,
  isLoading,
}: SalaryRatesProps) {
  // local state supports both manual keyed shape and rows
  const initFromInitial = Array.isArray((initialData as any)?.rows)
    ? ((initialData as any).rows as Row[])
    : Array.isArray((initialData as any)?.salaryRates)
    ? ((initialData as any).salaryRates as Row[])
    : WORKER_DESIGNATIONS.map((d) => ({
        designation: d,
        dailyRate: Number((initialData as any)?.[d] ?? 0),
      }));

  const [file, setFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"csv" | "manual">("manual");
  const [rows, setRows] = useState<Row[]>(
    initFromInitial.map((r) => ({
      designation: String(r.designation),
      dailyRate: Number(r.dailyRate) || 0,
    }))
  );

  const normalizeHeader = (s: string) =>
    s.toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ").trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(selectedFile);
    } else {
      alert("Please select a valid .csv file");
    }
  };

  const handleCSVUpload = async () => {
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      if (lines.length < 2) {
        alert("CSV must contain a header and at least one data row");
        return;
      }

      const header = lines[0].split(",").map((h) => normalizeHeader(h));
      // accept "designation" and "daily_rate" (with variations)
      const idxDesignation = header.findIndex((h) =>
        ["designation", "role", "worker", "title"].includes(h)
      );
      const idxDaily = header.findIndex((h) =>
        ["daily rate", "dailyrate", "daily", "rate"].includes(h)
      );

      if (idxDesignation === -1 || idxDaily === -1) {
        alert(
          `CSV header must include "designation" and "daily_rate". Got: ${header.join(
            ", "
          )}`
        );
        return;
      }

      const parsed: Row[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (!cols.length) continue;

        const designation = (cols[idxDesignation] ?? "").toLowerCase();
        const dailyRate = Number.parseFloat(cols[idxDaily] ?? "0");

        if (!designation) continue;
        if (!Number.isFinite(dailyRate) || dailyRate <= 0) continue;

        // Only allow known designations by default
        if (!WORKER_DESIGNATIONS.includes(designation as any)) continue;

        parsed.push({ designation, dailyRate });
      }

      if (!parsed.length) {
        alert("No valid salary rows found in CSV.");
        return;
      }

      // update local state & call parent
      setRows(parsed);
      onSave(machineType, { rows: parsed }); // ✅ IMPORTANT
    } catch (e) {
      console.error("CSV parse error:", e);
      alert("Error parsing CSV. Please check the format.");
    }
  };

  // Manual editing helpers
  const setValue = (designation: string, value: number) => {
    setRows((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.designation === designation);
      if (idx >= 0) {
        next[idx] = { ...next[idx], dailyRate: value };
      } else {
        next.push({ designation, dailyRate: value });
      }
      return next;
    });
  };

  const handleManualSubmit = () => {
    const cleaned = rows
      .map((r) => ({
        designation: String(r.designation).trim(),
        dailyRate: Number(r.dailyRate),
      }))
      .filter(
        (r) =>
          r.designation.length > 0 &&
          Number.isFinite(r.dailyRate) &&
          r.dailyRate > 0 &&
          WORKER_DESIGNATIONS.includes(r.designation as any)
      );

    if (!cleaned.length) {
      alert("Please enter at least one salary rate");
      return;
    }

    onSave(machineType, { rows: cleaned }); // ✅ IMPORTANT
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Daily Salary Rates — {MACHINE_TYPE_LABELS[machineType]}
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
                CSV columns (case-insensitive):{" "}
                <strong>designation, daily_rate</strong>
                <br />
                Valid designations: <code>operator</code>, <code>karigar</code>,{" "}
                <code>helper</code>.
                <span className="block text-xs mt-1">
                  Example:
                  <br />
                  designation,daily_rate
                  <br />
                  operator,2200
                  <br />
                  karigar,1800
                  <br />
                  helper,1500
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
                Enter daily salary rates for {MACHINE_TYPE_LABELS[machineType]}.
                These will be converted to monthly at save time.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WORKER_DESIGNATIONS.map((designation) => {
                const current =
                  rows.find((r) => r.designation === designation)?.dailyRate ??
                  0;
                return (
                  <div key={designation} className="space-y-2">
                    <Label htmlFor={designation} className="capitalize">
                      {designation} Daily Rate (Rs.)
                    </Label>
                    <Input
                      id={designation}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={current || ""}
                      onChange={(e) =>
                        setValue(
                          designation,
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                );
              })}
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
