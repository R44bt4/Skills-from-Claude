"use client";

import { useEffect, useRef, useState } from "react";
import { competencies, CompetencyKey } from "@/config/competencies";
import { Button } from "@/components/ui/button";
import { DeltaIndicator } from "./delta-indicator";
import { cn } from "@/lib/utils";

type ScoreValue = 0 | 1 | 2;
type CompScores = Record<string, Record<string, ScoreValue>>;
type AllScores = Record<string, CompScores>;
type AllComments = Record<string, string>;

interface ReviewComparisonProps {
  assessmentId: string;
  selfScores: AllScores;
  initialManagerScores: AllScores;
  initialComments: AllComments;
  reviewId?: string;
}

const SCORE_OPTIONS: ScoreValue[] = [0, 1, 2];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ReviewComparison({
  assessmentId,
  selfScores,
  initialManagerScores,
  initialComments,
}: ReviewComparisonProps) {
  const [managerScores, setManagerScores] = useState<AllScores>(
    initialManagerScores
  );
  const [comments, setComments] = useState<AllComments>(initialComments);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const debouncedScores = useDebounce(managerScores, 2000);
  const debouncedComments = useDebounce(comments, 2000);

  // Track whether we need to save (skip initial render)
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (submitted) return;

    async function save() {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/reviews/${assessmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scores: debouncedScores,
            comments: debouncedComments,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSaveError(data.error ?? "Auto-save failed");
        }
      } catch {
        setSaveError("Auto-save failed. Check your connection.");
      } finally {
        setSaving(false);
      }
    }

    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedScores, debouncedComments]);

  function setScore(
    compKey: string,
    levelIdx: string,
    skillIdx: string,
    value: ScoreValue
  ) {
    setManagerScores((prev) => ({
      ...prev,
      [compKey]: {
        ...(prev[compKey] ?? {}),
        [levelIdx]: {
          ...(prev[compKey]?.[levelIdx] ?? {}),
          [skillIdx]: value,
        },
      },
    }));
  }

  function setComment(compKey: string, value: string) {
    setComments((prev) => ({ ...prev, [compKey]: value }));
  }

  function hasDeltaForComp(compKey: string): boolean {
    const selfComp = selfScores[compKey] ?? {};
    const mgrComp = managerScores[compKey] ?? {};
    const allLevels = Array.from(
      new Set([...Object.keys(selfComp), ...Object.keys(mgrComp)])
    );
    for (const levelIdx of allLevels) {
      const selfLevel = selfComp[levelIdx] ?? {};
      const mgrLevel = mgrComp[levelIdx] ?? {};
      const allSkills = Array.from(
        new Set([...Object.keys(selfLevel), ...Object.keys(mgrLevel)])
      );
      for (const skillIdx of allSkills) {
        const selfVal = selfLevel[skillIdx] ?? 0;
        const mgrVal = mgrLevel[skillIdx] ?? 0;
        if (Math.abs(selfVal - mgrVal) !== 0) return true;
      }
    }
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // First save current state
      const saveRes = await fetch(`/api/reviews/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: managerScores, comments }),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        setSubmitError(data.error ?? "Failed to save before submit");
        return;
      }

      // Then submit
      const res = await fetch(`/api/reviews/${assessmentId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "Submit failed");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-2">
        <p className="text-green-700 font-semibold">Review submitted successfully.</p>
        <p className="text-sm text-green-600">
          Your manager review has been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {saving && (
        <p className="text-xs text-muted-foreground">Saving...</p>
      )}
      {saveError && (
        <p className="text-xs text-red-600">{saveError}</p>
      )}

      {(Object.keys(competencies) as CompetencyKey[]).map((compKey) => {
        const comp = competencies[compKey];
        const delta = hasDeltaForComp(compKey);
        const commentValue = comments[compKey] ?? "";
        const commentMissing = delta && commentValue.trim() === "";

        return (
          <div key={compKey} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{comp.name}</h2>
              <p className="text-sm text-muted-foreground">{comp.description}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium text-foreground w-1/2">
                      Skill
                    </th>
                    <th className="pb-2 pr-4 font-medium text-foreground text-center">
                      Self Score
                    </th>
                    <th className="pb-2 pr-4 font-medium text-foreground">
                      Manager Score
                    </th>
                    <th className="pb-2 font-medium text-foreground text-center">
                      Delta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comp.levels.map((level) => {
                    const levelIdx = String(level.index);
                    return level.skills.map((skill, skillIndex) => {
                      const skillIdx = String(skillIndex);
                      const selfVal =
                        (selfScores[compKey]?.[levelIdx]?.[skillIdx] as ScoreValue) ??
                        0;
                      const mgrVal =
                        (managerScores[compKey]?.[levelIdx]?.[skillIdx] as ScoreValue) ??
                        0;
                      const delta = mgrVal - selfVal;

                      return (
                        <tr
                          key={`${levelIdx}-${skillIdx}`}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="py-2 pr-4 text-foreground">
                            <span className="text-xs text-muted-foreground mr-1">
                              L{level.index}
                            </span>
                            {skill}
                          </td>
                          <td className="py-2 pr-4 text-center text-muted-foreground font-mono">
                            {selfVal}
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-1">
                              {SCORE_OPTIONS.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() =>
                                    setScore(compKey, levelIdx, skillIdx, opt)
                                  }
                                  className={cn(
                                    "w-8 h-7 rounded text-xs font-medium border transition-colors",
                                    mgrVal === opt
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 text-center">
                            <DeltaIndicator delta={delta} />
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-1">
              <label
                className={cn(
                  "text-xs font-medium",
                  commentMissing ? "text-red-600" : "text-muted-foreground"
                )}
              >
                Comment{delta ? " (Required — scores differ from self-assessment)" : ""}
              </label>
              <textarea
                value={commentValue}
                onChange={(e) => setComment(compKey, e.target.value)}
                rows={3}
                placeholder="Add your notes for this competency..."
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  commentMissing
                    ? "border-red-400 focus:ring-red-400"
                    : "border-border"
                )}
              />
              {commentMissing && (
                <p className="text-xs text-red-600">Required</p>
              )}
            </div>
          </div>
        );
      })}

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}
