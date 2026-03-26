"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AssessmentWizard } from "@/components/assessment/assessment-wizard";
import { AssessmentSummary } from "@/components/assessment/assessment-summary";

interface Cycle {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

interface Assessment {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  scores: string | Record<string, unknown>;
  careerTrack?: string;
}

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "no_cycle" }
  | { kind: "no_assessment"; cycle: Cycle }
  | { kind: "draft"; cycle: Cycle; assessment: Assessment }
  | { kind: "submitted"; cycle: Cycle; assessment: Assessment };

function parseScores(
  raw: string | Record<string, unknown>
): Record<string, Record<string, Record<string, 0 | 1 | 2>>> {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export default function AssessmentPage() {
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch("/api/assessments/active");
        if (res.status === 404) {
          setState({ kind: "no_cycle" });
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({ kind: "error", message: data.error ?? "Failed to load assessment data" });
          return;
        }
        const data = await res.json();
        const cycle: Cycle = data.cycle;
        const assessment: Assessment | null = data.assessment;

        if (!assessment) {
          setState({ kind: "no_assessment", cycle });
        } else if (assessment.status === "SUBMITTED") {
          setState({ kind: "submitted", cycle, assessment });
        } else {
          setState({ kind: "draft", cycle, assessment });
        }
      } catch {
        setState({ kind: "error", message: "Network error. Please try again." });
      }
    }

    fetchActive();
  }, []);

  async function handleStartAssessment() {
    setCreating(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          message: data.error ?? "Failed to start assessment",
        });
        return;
      }
      const assessment: Assessment = await res.json();
      setState((currentState) => {
        if (currentState.kind === "no_assessment") {
          return { kind: "draft", cycle: currentState.cycle, assessment };
        }
        return currentState;
      });
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    } finally {
      setCreating(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading...
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

  if (state.kind === "no_cycle") {
    return (
      <div className="rounded-lg border border-border p-8 text-center space-y-3">
        <h1 className="text-xl font-semibold text-foreground">
          No Active Assessment Cycle
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          There is no open assessment cycle at this time. Your manager will
          notify you when the next cycle begins.
        </p>
      </div>
    );
  }

  if (state.kind === "no_assessment") {
    return (
      <div className="rounded-lg border border-border p-8 text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">
          {state.cycle.name}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          An assessment cycle is open. Complete your self-assessment to track
          your career progress across all 6 competencies.
        </p>
        <Button onClick={handleStartAssessment} disabled={creating}>
          {creating ? "Starting..." : "Start Assessment"}
        </Button>
      </div>
    );
  }

  if (state.kind === "submitted") {
    const scores = parseScores(state.assessment.scores);
    const careerTrack = state.assessment.careerTrack ?? "";
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          You have already submitted your assessment for{" "}
          <strong>{state.cycle.name}</strong>.
        </div>
        <AssessmentSummary
          assessmentId={state.assessment.id}
          scores={scores}
          careerTrack={careerTrack}
        />
      </div>
    );
  }

  // state.kind === "draft"
  const scores = parseScores(state.assessment.scores);
  const careerTrack = state.assessment.careerTrack ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Self-Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {state.cycle.name} — Your progress is saved automatically.
        </p>
      </div>
      <AssessmentWizard
        assessmentId={state.assessment.id}
        initialScores={scores}
        careerTrack={careerTrack}
      />
    </div>
  );
}
