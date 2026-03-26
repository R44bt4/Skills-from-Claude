"use client";

import { useState } from "react";

// Competency columns in display order
const COMPETENCY_KEYS = [
  "delivery",
  "domainExpertise",
  "problemSolving",
  "communication",
  "leadership",
  "aiSupremacy",
] as const;

type CompetencyKey = (typeof COMPETENCY_KEYS)[number];

const COMPETENCY_ABBREV: Record<CompetencyKey, string> = {
  delivery: "DEL",
  domainExpertise: "DOM",
  problemSolving: "PS",
  communication: "COM",
  leadership: "LED",
  aiSupremacy: "AI",
};

interface Employee {
  id: string;
  name: string;
  careerTrack: string;
}

export interface TeamEntry {
  assessmentId: string;
  employee: Employee;
  selfLevels: Record<string, number> | null;
  selfProgress: number | null;
  managerLevels: Record<string, number> | null;
  managerProgress: number | null;
  calibrationLevels?: Record<string, number>;
  calibrationProgress?: number;
  hasCalibration: boolean;
}

interface TeamGridProps {
  teamData: TeamEntry[];
  onCalibrate: (
    assessmentId: string,
    scores: Record<string, number>,
    progress: number
  ) => void;
}

function getDisplayLevel(
  entry: TeamEntry,
  key: CompetencyKey
): number | null {
  if (entry.calibrationLevels && entry.calibrationLevels[key] != null) {
    return entry.calibrationLevels[key];
  }
  if (entry.managerLevels && entry.managerLevels[key] != null) {
    return entry.managerLevels[key];
  }
  return null;
}

export function TeamGrid({ teamData, onCalibrate }: TeamGridProps) {
  // Local state for edited levels per assessmentId -> competencyKey -> level
  const [edits, setEdits] = useState<
    Record<string, Record<string, number>>
  >({});

  function getLevel(entry: TeamEntry, key: CompetencyKey): number | null {
    if (edits[entry.assessmentId]?.[key] != null) {
      return edits[entry.assessmentId][key];
    }
    return getDisplayLevel(entry, key);
  }

  function handleCellClick(entry: TeamEntry, key: CompetencyKey) {
    const current = getLevel(entry, key) ?? 0;
    const next = current >= 5 ? 0 : current + 1;

    const currentAllLevels: Record<string, number> = {};
    for (const k of COMPETENCY_KEYS) {
      const v = getLevel(entry, k);
      currentAllLevels[k] = v ?? 0;
    }
    const newLevels = { ...currentAllLevels, [key]: next };

    setEdits((prev) => ({
      ...prev,
      [entry.assessmentId]: {
        ...(prev[entry.assessmentId] ?? {}),
        [key]: next,
      },
    }));

    // Compute simple average progress from levels
    const vals = Object.values(newLevels);
    const progress = vals.reduce((a, b) => a + b, 0) / vals.length;

    onCalibrate(entry.assessmentId, newLevels, progress);
  }

  if (teamData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No team members found for the active cycle.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-medium text-foreground">Employee</th>
            {COMPETENCY_KEYS.map((key) => (
              <th
                key={key}
                className="pb-2 px-2 font-medium text-foreground text-center"
                title={key}
              >
                {COMPETENCY_ABBREV[key]}
              </th>
            ))}
            <th className="pb-2 pl-4 font-medium text-foreground text-center">
              Progress
            </th>
            <th className="pb-2 pl-4 font-medium text-foreground text-center">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {teamData.map((entry) => {
            const isCalibrated =
              entry.hasCalibration ||
              Object.keys(edits[entry.assessmentId] ?? {}).length > 0;

            return (
              <tr
                key={entry.assessmentId}
                className="border-b border-border last:border-b-0"
              >
                <td className="py-2 pr-4">
                  <p className="font-medium text-foreground">
                    {entry.employee.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.employee.careerTrack}
                  </p>
                </td>
                {COMPETENCY_KEYS.map((key) => {
                  const level = getLevel(entry, key);
                  return (
                    <td key={key} className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleCellClick(entry, key)}
                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                          isCalibrated
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                        title={`Click to cycle level (0-5). Current: ${level ?? "—"}`}
                      >
                        {level ?? "—"}
                      </button>
                    </td>
                  );
                })}
                <td className="py-2 pl-4 text-center text-muted-foreground">
                  {(
                    entry.calibrationProgress ??
                    entry.managerProgress ??
                    null
                  )?.toFixed(1) ?? "—"}
                </td>
                <td className="py-2 pl-4 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isCalibrated
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {isCalibrated ? "Calibrated" : "Pending"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
