"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Upload, FileText } from "lucide-react";
import { MACHINE_TYPE_LABELS } from "../../lib/constants";
import type { BonusUploadData, MachineType } from "../../lib/types";

interface BonusUploadProps {
  machineId: string;
  machineType: MachineType;
  onUpload: (data: BonusUploadData) => void;
  isLoading?: boolean;
}

export function BonusUpload({
  machineId,
  machineType,
  onUpload,
  isLoading,
}: BonusUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState<BonusUploadData>({});
  const [uploadMethod, setUploadMethod] = useState<"csv" | "manual">("manual");

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
      const lines = text.split("\n").filter((line) => line.trim()); // Remove empty lines

      if (lines.length < 2) {
        alert("CSV file must contain at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      console.log(" CSV Headers:", headers);

      const bonusRates: Array<{
        stitchCount: number;
        bonusType: "stitch" | "2 head" | "sheet";
        rate: number;
      }> = [];

      // Skip header row and process data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());

        if (values.length >= 3) {
          const stitchCount = Number.parseInt(values[0]) || 0;
          const headRate = Number.parseFloat(values[1]) || 0;
          const sheetRate = Number.parseFloat(values[2]) || 0;

          // Add entries for each bonus type with rates > 0
          if (headRate > 0) {
            bonusRates.push({
              stitchCount,
              bonusType: "2 head",
              rate: headRate,
            });
          }

          if (sheetRate > 0) {
            bonusRates.push({
              stitchCount,
              bonusType: "sheet",
              rate: sheetRate,
            });
          }

          // Add stitch bonus if there's a fourth column
          if (values.length >= 4) {
            const stitchRate = Number.parseFloat(values[3]) || 0;
            if (stitchRate > 0) {
              bonusRates.push({
                stitchCount,
                bonusType: "stitch",
                rate: stitchRate,
              });
            }
          }
        }
      }

      console.log(" Parsed bonus rates:", bonusRates);

      if (bonusRates.length === 0) {
        alert("No valid bonus rates found in CSV file");
        return;
      }

      const data: BonusUploadData = { bonusRates };
      onUpload(data);
    } catch (error) {
      console.error("  Error parsing CSV:", error);
      alert("Error parsing CSV file. Please check the format.");
    }
  };

  const handleManualSubmit = () => {
    const hasData =
      manualData.stitch || manualData["2 head"] || manualData.sheet;
    if (!hasData) {
      alert("Please enter at least one bonus rate");
      return;
    }
    onUpload(manualData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Upload Bonus Rates - {MACHINE_TYPE_LABELS[machineType]}
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
                <strong>stitch_count, 2_head_rate, sheet_rate</strong>. Each row
                represents a different stitch count tier with corresponding
                bonus rates.
                <br />
                <span className="text-xs mt-1 block">
                  Example: 1000,5.50,4.25 (1000 stitches, Rs.5.50 for 2-head,
                  Rs.4.25 for sheet)
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
                Enter base bonus rates for {MACHINE_TYPE_LABELS[machineType]}.
                These will be applied to all stitch counts.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stitch">Stitch Rate (Rs.)</Label>
                <Input
                  id="stitch"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualData.stitch || ""}
                  onChange={(e) =>
                    setManualData((prev) => ({
                      ...prev,
                      stitch: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="head">2 Head Rate (Rs.)</Label>
                <Input
                  id="head"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualData["2 head"] || ""}
                  onChange={(e) =>
                    setManualData((prev) => ({
                      ...prev,
                      "2 head": Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sheet">Sheet Rate (Rs.)</Label>
                <Input
                  id="sheet"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualData.sheet || ""}
                  onChange={(e) =>
                    setManualData((prev) => ({
                      ...prev,
                      sheet: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleManualSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Bonus Rates"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
