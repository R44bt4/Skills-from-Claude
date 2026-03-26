"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { competencies, CompetencyKey } from "@/config/competencies";
import { roles, RoleKey } from "@/config/roles";
import { CompetencySection } from "./competency-section";
import { AssessmentSummary } from "./assessment-summary";

interface AssessmentWizardProps {
  assessmentId: string;
  initialScores: Record<string, Record<string, Record<string, 0 | 1 | 2>>>;
  careerTrack: string;
}

const COMPETENCY_KEYS = Object.keys(competencies) as CompetencyKey[];

export function AssessmentWizard({
  assessmentId,
  initialScores,
  careerTrack,
}: AssessmentWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<
    Record<string, Record<string, Record<string, 0 | 1 | 2>>>
  >(initialScores ?? {});
  const [showSummary, setShowSummary] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalCompetencies = COMPETENCY_KEYS.length;
  const isLast = currentIndex === totalCompetencies - 1;
  const progressPct = ((currentIndex + 1) / totalCompetencies) * 100;

  const roleData = roles[careerTrack as RoleKey];

  function handleScoreChange(
    competencyKey: string,
    levelIdx: string,
    skillIdx: string,
    value: 0 | 1 | 2
  ) {
    const updatedScores = {
      ...scores,
      [competencyKey]: {
        ...(scores[competencyKey] ?? {}),
        [levelIdx]: {
          ...((scores[competencyKey] ?? {})[levelIdx] ?? {}),
          [skillIdx]: value,
        },
      },
    };

    setScores(updatedScores);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/assessments/${assessmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores: updatedScores }),
        });
      } catch {
        // Silent auto-save failure — user can still proceed
      }
    }, 2000);
  }

  function handlePrevious() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    if (isLast) {
      setShowSummary(true);
    } else {
      setCurrentIndex((i) => Math.min(totalCompetencies - 1, i + 1));
    }
  }

  if (showSummary) {
    return (
      <AssessmentSummary
        assessmentId={assessmentId}
        scores={scores}
        careerTrack={careerTrack}
      />
    );
  }

  const currentKey = COMPETENCY_KEYS[currentIndex];
  const currentCompetency = competencies[currentKey];
  const roleWeight = roleData?.weights[currentKey] ?? 0;
  const competencyScores = scores[currentKey] ?? {};

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Competency {currentIndex + 1} of {totalCompetencies}
          </span>
          <span>{currentCompetency.name}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Competency content */}
      <CompetencySection
        competencyKey={currentKey}
        competency={currentCompetency}
        roleWeight={roleWeight}
        scores={competencyScores}
        onScoreChange={(levelIdx, skillIdx, value) =>
          handleScoreChange(currentKey, levelIdx, skillIdx, value)
        }
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Button onClick={handleNext}>
          {isLast ? "Review & Submit" : "Next"}
        </Button>
      </div>
    </div>
  );
}
