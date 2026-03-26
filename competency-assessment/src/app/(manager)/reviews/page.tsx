"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TeamReviewSummary } from "@/components/review/team-review-summary";

interface Employee {
  id: string;
  name: string;
  careerTrack: string;
}

interface ManagerReview {
  id: string;
  status: string;
  careerProgress: number | null;
}

interface PendingAssessment {
  id: string;
  status: string;
  careerProgress: number | null;
  employee: Employee;
  managerReview: ManagerReview | null;
}

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; assessments: PendingAssessment[] };

export default function ReviewsPage() {
  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reviews/pending");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({
            kind: "error",
            message: data.error ?? "Failed to load pending reviews",
          });
          return;
        }
        const data: PendingAssessment[] = await res.json();
        setState({ kind: "loaded", assessments: data });
      } catch {
        setState({ kind: "error", message: "Network error. Please try again." });
      }
    }
    load();
  }, []);

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

  const { assessments } = state;

  const summaryRows = assessments.map((a) => ({
    employee: a.employee,
    selfProgress: a.careerProgress,
    managerProgress: a.managerReview?.careerProgress ?? null,
    status: a.managerReview?.status ?? "PENDING",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your direct reports&apos; self-assessments.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Team Overview</h2>
        <TeamReviewSummary reviews={summaryRows} />
      </section>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No pending reviews. All direct reports have been reviewed, or no
            assessments have been submitted yet.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Pending Reviews
          </h2>
          <div className="space-y-3">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {assessment.employee.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assessment.employee.careerTrack}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/reviews/${assessment.id}`}>Review</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
