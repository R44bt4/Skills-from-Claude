"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GrowthPlanContent } from "@/lib/validations";
import { competencies } from "@/config/competencies";

type Priority = GrowthPlanContent["priorities"][number];

interface PriorityCardProps {
  priority: Priority;
}

const RANK_COLORS: Record<number, string> = {
  1: "border-red-400",
  2: "border-orange-400",
};

function getPhaseColor(phaseName: string): string {
  if (phaseName === "Foundation") return "bg-blue-50 border-blue-200 text-blue-800";
  if (phaseName === "Practice") return "bg-amber-50 border-amber-200 text-amber-800";
  return "bg-green-50 border-green-200 text-green-800";
}

function CollapsiblePhase({
  phase,
}: {
  phase: Priority["phases"][number];
}) {
  const [open, setOpen] = useState(false);
  const colorClass = getPhaseColor(phase.name);

  return (
    <div className={`rounded border ${colorClass} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span>
          {phase.name}{" "}
          <span className="font-normal opacity-70">(Month {phase.months})</span>
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 bg-white border-t border-inherit">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mt-2 mb-1">
              Actions
            </p>
            <ul className="space-y-1">
              {phase.actions.map((action, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
          {phase.deliverables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mt-2 mb-1">
                Deliverables
              </p>
              <ul className="space-y-1">
                {phase.deliverables.map((d, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PriorityCard({ priority }: PriorityCardProps) {
  const borderColor = RANK_COLORS[priority.rank] ?? "border-blue-400";
  const compName =
    competencies[priority.competency as keyof typeof competencies]?.name ??
    priority.competency;

  return (
    <div className={`rounded-lg border-2 ${borderColor} bg-white p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              #{priority.rank} Priority
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{compName}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-muted-foreground">
            Level {priority.currentLevel} → {priority.targetLevel}
          </p>
          <p className="text-xs text-muted-foreground">
            Weight: {priority.roleWeight}%
          </p>
        </div>
      </div>

      {/* Failing skills */}
      {priority.skills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Skills to develop
          </p>
          <ul className="space-y-1">
            {priority.skills.map((skill, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <span
                  className={`inline-block w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    skill.currentScore === 0
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {skill.currentScore}
                </span>
                {skill.skill}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phases */}
      {priority.phases.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Development Phases
          </p>
          {priority.phases.map((phase, i) => (
            <CollapsiblePhase key={i} phase={phase} />
          ))}
        </div>
      )}

      {/* Resources */}
      {priority.resources.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Resources
          </p>
          <div className="space-y-2">
            {priority.resources.map((resource, i) => (
              <div
                key={i}
                className="rounded border border-border bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-muted-foreground bg-white border border-border rounded px-1.5 py-0.5">
                    {resource.type}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {resource.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {resource.description}
                </p>
                {resource.relevance && (
                  <p className="text-xs text-muted-foreground italic mt-0.5">
                    {resource.relevance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
