"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Upload, FileText } from "lucide-react";
import { MACHINE_TYPE_LABELS } from "../../lib/constants";
import type { BonusUploadData, MachineType } from "../../lib/types";

type ParsedRow = {
  stitchCount: number;
  twoHead: number;
  sheet: number;
};

interface BonusUploadProps {
  machineType: MachineType;
  onUpload: (machineType: MachineType, data: BonusUploadData) => void; // machineType-first
  isLoading?: boolean;
}

export function BonusUpload({
  machineType,
  onUpload,
  isLoading,
}: BonusUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState<BonusUploadData>({});
  const [uploadMethod, setUploadMethod] = useState<"csv" | "manual">("csv");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(selectedFile);
    } else {
      alert("Please select a .csv file");
    }
  };

  // --- CSV helpers ----------------------------------------------------------
  const normalizeHeader = (s: string) =>
    s.toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ").trim();

  function parseCsv(text: string): ParsedRow[] {
    const rows: ParsedRow[] = [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#")); // skip empty & comment lines

    if (lines.length < 2) {
      throw new Error("CSV must include a header and at least one data row.");
    }

    const header = lines[0].split(",").map((h) => normalizeHeader(h));

    // Accept aliases for the 3 columns
    const idxStitches =
      header.findIndex((h) =>
        ["stitches", "stitch count", "stitchcount"].includes(h)
      ) ?? -1;
    const idx2Head = header.findIndex((h) =>
      ["2 head", "two head"].includes(h)
    );
    const idxSheet = header.findIndex((h) =>
      ["sheet", "sheet rate"].includes(h)
    );

    if (idxStitches === -1 || idx2Head === -1 || idxSheet === -1) {
      throw new Error(
        `Header must include columns "stitches", "2 head", "sheet". Got: ${header.join(
          ", "
        )}`
      );
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (!cols.length) continue;

      const stitchesRaw = cols[idxStitches] ?? "";
      const twoHeadRaw = cols[idx2Head] ?? "";
      const sheetRaw = cols[idxSheet] ?? "";

      // Allow blanks; treat non-numeric as 0
      const stitchCount = Number.parseInt(stitchesRaw);
      const twoHead = Number.parseFloat(twoHeadRaw) || 0;
      const sheet = Number.parseFloat(sheetRaw) || 0;

      if (!Number.isFinite(stitchCount) || Number.isNaN(stitchCount)) {
        throw new Error(`Row ${i + 1}: "stitches" must be an integer.`);
      }
      if (stitchCount < 0) {
        throw new Error(`Row ${i + 1}: "stitches" cannot be negative.`);
      }
      if (twoHead < 0 || sheet < 0) {
        throw new Error(`Row ${i + 1}: rates cannot be negative.`);
      }

      // If both rates are 0, skip the row (no effect)
      if (twoHead === 0 && sheet === 0) continue;

      rows.push({ stitchCount, twoHead, sheet });
    }

    // Sort by stitchCount ascending and de-duplicate (keep last occurrence)
    const map = new Map<number, ParsedRow>();
    for (const r of rows) map.set(r.stitchCount, r);
    return Array.from(map.values()).sort(
      (a, b) => a.stitchCount - b.stitchCount
    );
  }

  const handleCSVUpload = async () => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);

      // Flatten into your expected payload:
      //  { bonusRates: { stitchCount, bonusType: "2 head"|"sheet", rate }[] }
      const bonusRates: Array<{
        stitchCount: number;
        bonusType: "2 head" | "sheet";
        rate: number;
      }> = [];

      for (const row of parsed) {
        if (row.twoHead > 0)
          bonusRates.push({
            stitchCount: row.stitchCount,
            bonusType: "2 head",
            rate: row.twoHead,
          });
        if (row.sheet > 0)
          bonusRates.push({
            stitchCount: row.stitchCount,
            bonusType: "sheet",
            rate: row.sheet,
          });
      }

      if (bonusRates.length === 0) {
        alert("No non-zero rates found in CSV.");
        return;
      }

      onUpload(machineType, { bonusRates });
    } catch (e: any) {
      console.error("CSV parse error:", e);
      alert(e?.message || "Error parsing CSV. Please check the format.");
    }
  };

  // --- Manual mode ----------------------------------------------------------
  const handleManualSubmit = () => {
    const hasData =
      manualData["2 head"] != null ||
      manualData["sheet"] != null ||
      manualData["stitch"] != null;

    if (!hasData) {
      alert("Please enter at least one rate.");
      return;
    }
    onUpload(machineType, manualData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Upload Bonus Rates — {MACHINE_TYPE_LABELS[machineType]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={uploadMethod === "csv" ? "default" : "outline"}
            onClick={() => setUploadMethod("csv")}
            size="sm"
          >
            CSV Upload
          </Button>
          <Button
            variant={uploadMethod === "manual" ? "default" : "outline"}
            onClick={() => setUploadMethod("manual")}
            size="sm"
          >
            Manual Entry
          </Button>
        </div>

        {uploadMethod === "csv" ? (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                CSV columns (case-insensitive):{" "}
                <strong>stitches, 2 head, sheet</strong>
                <br />
                Each row defines a threshold. The flat amount applies until the
                next threshold is met.
                <br />
                <span className="text-xs mt-1 block">
                  Example:
                  <br />
                  stitches,2 head,sheet
                  <br />
                  500000,100,200
                  <br />
                  600000,200,400
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
                These will be applied as flat amounts at their thresholds.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stitch">Stitch Rate (flat)</Label>
                <Input
                  id="stitch"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualData.stitch ?? ""}
                  onChange={(e) =>
                    setManualData((p) => ({
                      ...p,
                      stitch: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head">2 Head Rate (flat)</Label>
                <Input
                  id="head"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualData["2 head"] ?? ""}
                  onChange={(e) =>
                    setManualData((p) => ({
                      ...p,
                      "2 head": Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet">Sheet Rate (flat)</Label>
                <Input
                  id="sheet"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualData.sheet ?? ""}
                  onChange={(e) =>
                    setManualData((p) => ({
                      ...p,
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
