"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KpiEntry {
  selfProgress: number | null;
  managerProgress: number | null;
  hasCalibration: boolean;
}

interface CalibrationKPIsProps {
  teamData: KpiEntry[];
}

export function CalibrationKPIs({ teamData }: CalibrationKPIsProps) {
  const withManagerProgress = teamData.filter(
    (e) => e.managerProgress != null
  );
  const teamAvgProgress =
    withManagerProgress.length > 0
      ? withManagerProgress.reduce((sum, e) => sum + e.managerProgress!, 0) /
        withManagerProgress.length
      : null;

  const pendingCalibrations = teamData.filter((e) => !e.hasCalibration).length;

  const largeDeltas = teamData.filter((e) => {
    if (e.selfProgress == null || e.managerProgress == null) return false;
    return Math.abs(e.selfProgress - e.managerProgress) > 1;
  }).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Team Avg Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">
            {teamAvgProgress != null ? teamAvgProgress.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on manager review scores
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Calibrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">
            {pendingCalibrations}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Employees without a final calibration
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Large Deltas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{largeDeltas}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Self vs manager gap &gt; 1
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
