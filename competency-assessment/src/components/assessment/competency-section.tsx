"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { CompetencyKey, Competency } from "@/config/competencies";
import { SkillRater } from "./skill-rater";

interface CompetencySectionProps {
  competencyKey: CompetencyKey;
  competency: Competency;
  roleWeight: number;
  scores: Record<string, Record<string, 0 | 1 | 2>>;
  onScoreChange: (
    levelIdx: string,
    skillIdx: string,
    value: 0 | 1 | 2
  ) => void;
}

export function CompetencySection({
  competencyKey,
  competency,
  roleWeight,
  scores,
  onScoreChange,
}: CompetencySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {competency.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {competency.description}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          {roleWeight}% of your score
        </span>
      </div>

      {competency.levels.map((level) => {
        const levelKey = String(level.index);
        const levelScores = scores[levelKey] ?? {};

        return (
          <div key={level.index} className="space-y-1">
            <h3 className="text-base font-semibold text-foreground border-b border-border pb-1">
              Level {level.index} — {level.name}
            </h3>
            <div className="pl-2">
              {level.skills.map((skill, skillIndex) => {
                const skillKey = String(skillIndex);
                return (
                  <SkillRater
                    key={skillIndex}
                    skillText={skill}
                    value={levelScores[skillKey]}
                    onChange={(val) => onScoreChange(levelKey, skillKey, val)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
