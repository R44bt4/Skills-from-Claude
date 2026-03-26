"use client";

import { useEffect, useState } from "react";
import { ReviewComparison } from "@/components/review/review-comparison";

interface Employee {
  id: string;
  name: string;
  careerTrack: string;
}

interface ReviewData {
  review: {
    id: string;
    scores: string;
    comments: string;
    status: string;
  };
  selfAssessment: {
    id: string;
    scores: string;
  };
  employee: Employee;
}

type PageState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; data: ReviewData };

function parseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

interface PageProps {
  params: { id: string };
}

export default function ReviewPage({ params }: PageProps) {
  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reviews/${params.id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({
            kind: "error",
            message: data.error ?? "Failed to load review",
          });
          return;
        }
        const data: ReviewData = await res.json();
        setState({ kind: "loaded", data });
      } catch {
        setState({ kind: "error", message: "Network error. Please try again." });
      }
    }
    load();
  }, [params.id]);

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

  const { data } = state;
  const selfScores = parseJson(data.selfAssessment.scores) as Record<
    string,
    Record<string, Record<string, 0 | 1 | 2>>
  >;
  const managerScores = parseJson(data.review.scores) as Record<
    string,
    Record<string, Record<string, 0 | 1 | 2>>
  >;
  const reviewComments = parseJson(data.review.comments) as Record<
    string,
    string
  >;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Review: {data.employee.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.employee.careerTrack}
        </p>
      </div>

      {data.review.status === "SUBMITTED" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          This review has already been submitted.
        </div>
      )}

      <ReviewComparison
        assessmentId={params.id}
        selfScores={selfScores}
        initialManagerScores={managerScores}
        initialComments={reviewComments}
        reviewId={data.review.id}
      />
    </div>
  );
}
