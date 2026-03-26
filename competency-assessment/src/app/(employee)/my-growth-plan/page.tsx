"use client";

import { useEffect, useState } from "react";
import { GrowthPlanView } from "@/components/growth-plan/growth-plan-view";
import { GrowthPlanContent, GrowthPlanContentSchema } from "@/lib/validations";
import { CompetencyKey } from "@/config/competencies";
import { RoleKey, roles } from "@/config/roles";

interface GrowthPlanRecord {
  id: string;
  status: "GENERATING" | "READY" | "FAILED";
  content: string;
  errorMessage?: string | null;
  employeeId: string;
  cycleId: string;
  calibration: {
    finalLevels: string;
    finalScores: string;
  };
  employee?: {
    name: string;
    careerTrack: string;
  };
}

type PageState =
  | { kind: "loading" }
  | { kind: "no_plan" }
  | { kind: "generating" }
  | { kind: "failed"; errorMessage: string }
  | {
      kind: "ready";
      plan: GrowthPlanContent;
      employeeName: string;
      roleName: string;
      currentLevels: Record<CompetencyKey, number>;
      targetLevels: Record<CompetencyKey, number>;
      weights: Record<CompetencyKey, number>;
    }
  | { kind: "error"; message: string };

function parseLevels(json: string): Record<CompetencyKey, number> {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {} as Record<CompetencyKey, number>;
  }
}

function computeTargetLevels(
  currentLevels: Record<CompetencyKey, number>
): Record<CompetencyKey, number> {
  const result = {} as Record<CompetencyKey, number>;
  for (const [key, level] of Object.entries(currentLevels)) {
    result[key as CompetencyKey] = Math.min(5, (level as number) + 1);
  }
  return result;
}

export default function MyGrowthPlanPage() {
  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/growth-plan/mine");

        if (res.status === 404) {
          setState({ kind: "no_plan" });
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({
            kind: "error",
            message: data.error ?? "Failed to load growth plan",
          });
          return;
        }

        const record: GrowthPlanRecord = await res.json();

        if (record.status === "GENERATING") {
          setState({ kind: "generating" });
          return;
        }

        if (record.status === "FAILED") {
          setState({
            kind: "failed",
            errorMessage:
              record.errorMessage ?? "An error occurred during generation",
          });
          return;
        }

        // READY
        let parsedContent: GrowthPlanContent;
        try {
          const raw = JSON.parse(record.content);
          parsedContent = GrowthPlanContentSchema.parse(raw);
        } catch {
          setState({
            kind: "error",
            message: "Growth plan data is invalid. Contact your admin.",
          });
          return;
        }

        const currentLevels = parseLevels(record.calibration.finalLevels);
        const targetLevels = computeTargetLevels(currentLevels);

        // Determine role info
        const careerTrack = (record.employee?.careerTrack ?? "") as RoleKey;
        const role = roles[careerTrack];
        const weights = (role?.weights ?? {}) as Record<CompetencyKey, number>;
        const roleName = role?.name ?? careerTrack;
        const employeeName = record.employee?.name ?? "Employee";

        setState({
          kind: "ready",
          plan: parsedContent,
          employeeName,
          roleName,
          currentLevels,
          targetLevels,
          weights,
        });
      } catch {
        setState({ kind: "error", message: "Network error. Please try again." });
      }
    }

    fetchPlan();
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (state.kind === "no_plan") {
    return (
      <div className="rounded-lg border border-border p-8 text-center space-y-3">
        <h1 className="text-xl font-semibold text-foreground">
          No Growth Plan Available Yet
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          No growth plan available yet. Complete an assessment cycle first.
        </p>
      </div>
    );
  }

  if (state.kind === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-muted-foreground text-sm">
          Your growth plan is being generated...
        </p>
        <p className="text-xs text-muted-foreground">
          This may take up to a minute. Refresh the page to check.
        </p>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-2">
        <p className="text-red-700 font-medium">Growth plan generation failed</p>
        <p className="text-sm text-red-600">{state.errorMessage}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Contact your admin to regenerate the plan.
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-2">
        <p className="text-red-700 font-medium">Something went wrong</p>
        <p className="text-sm text-red-600">{state.message}</p>
      </div>
    );
  }

  // state.kind === "ready"
  return (
    <div className="space-y-6">
      <GrowthPlanView
        plan={state.plan}
        currentLevels={state.currentLevels}
        targetLevels={state.targetLevels}
        weights={state.weights}
        employeeName={state.employeeName}
        roleName={state.roleName}
      />
    </div>
  );
}
