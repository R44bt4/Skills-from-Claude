"use client";

import { useState, useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { competencies, CompetencyKey } from "@/config/competencies";
import { roles, RoleKey } from "@/config/roles";
import { computeCompetencyLevel, computeCareerProgress } from "@/lib/scoring-engine";

const COMPETENCY_KEYS = Object.keys(competencies) as CompetencyKey[];

interface AssessmentSummaryProps {
  assessmentId: string;
  scores: Record<string, Record<string, Record<string, 0 | 1 | 2>>>;
  careerTrack: string;
}

export function AssessmentSummary({
  assessmentId,
  scores,
  careerTrack,
}: AssessmentSummaryProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalProgress, setFinalProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleData = roles[careerTrack as RoleKey];

  const computedLevels = useMemo(() => {
    const levels: Record<CompetencyKey, number> = {} as Record<
      CompetencyKey,
      number
    >;
    for (const key of COMPETENCY_KEYS) {
      const compScores = scores[key] ?? {};
      levels[key] = computeCompetencyLevel(compScores, key);
    }
    return levels;
  }, [scores]);

  const careerProgress = useMemo(() => {
    if (!roleData) return 0;
    return computeCareerProgress(computedLevels, roleData.weights);
  }, [computedLevels, roleData]);

  const chartData = Object.entries(computedLevels).map(([key, level]) => ({
    competency: competencies[key as CompetencyKey].name,
    level,
    fullMark: 5,
  }));

  const levelNames = [
    "Starter",
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
    "Leading Expert",
  ];

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed");
      }
      const data = await res.json();
      setFinalProgress(data.careerProgress ?? careerProgress);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl font-bold text-green-600">
          {(finalProgress ?? careerProgress).toFixed(2)}
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Assessment Submitted!
        </h2>
        <p className="text-muted-foreground">
          Your career progress score has been recorded. Your manager will review
          your self-assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Assessment Summary
        </h2>
        <p className="text-muted-foreground mt-1">
          Review your scores before submitting.
        </p>
      </div>

      {/* Career progress score */}
      <div className="flex items-center justify-center py-6 rounded-lg bg-blue-50 border border-blue-100">
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-700">
            {careerProgress.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Career Progress Score (out of 5)
          </div>
        </div>
      </div>

      {/* Radar chart */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-base font-semibold mb-4">Competency Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="competency" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Level"
              dataKey="level"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Competency breakdown */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Competency Levels</h3>
        <div className="grid gap-2">
          {COMPETENCY_KEYS.map((key) => {
            const level = computedLevels[key];
            const comp = competencies[key];
            const weight = roleData?.weights[key] ?? 0;
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3"
              >
                <div>
                  <span className="font-medium text-sm">{comp.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({weight}% weight)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700">
                    Level {level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {levelNames[level]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {error}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit Assessment"}
      </Button>
    </div>
  );
}
