import { GrowthPlanContent } from "@/lib/validations";
import { CompetencyKey } from "@/config/competencies";
import { RadarChart } from "./radar-chart";
import { PriorityCard } from "./priority-card";
import { QuickWins } from "./quick-wins";

interface GrowthPlanViewProps {
  plan: GrowthPlanContent;
  currentLevels: Record<CompetencyKey, number>;
  targetLevels: Record<CompetencyKey, number>;
  weights: Record<CompetencyKey, number>;
  employeeName: string;
  roleName: string;
}

function ProgressBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function GrowthPlanView({
  plan,
  currentLevels,
  targetLevels,
  weights,
  employeeName,
  roleName,
}: GrowthPlanViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-border bg-white p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            6-Month Growth Plan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {employeeName} — {roleName}
          </p>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{plan.summary}</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Current Progress
            </p>
            <p className="text-2xl font-bold text-foreground">
              {plan.currentProgress.toFixed(1)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / 5
              </span>
            </p>
            <ProgressBar value={plan.currentProgress} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Target Progress
            </p>
            <p className="text-2xl font-bold text-green-600">
              {plan.targetProgress.toFixed(1)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / 5
              </span>
            </p>
            <ProgressBar value={plan.targetProgress} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Timeline
            </p>
            <p className="text-2xl font-bold text-foreground">
              {plan.timelineMonths}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                months
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Competency Overview
        </h3>
        <RadarChart
          currentLevels={currentLevels}
          targetLevels={targetLevels}
          weights={weights}
        />
      </div>

      {/* Priority Cards */}
      {plan.priorities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Focus Areas
          </h3>
          {plan.priorities.map((priority, i) => (
            <PriorityCard key={i} priority={priority} />
          ))}
        </div>
      )}

      {/* Quick Wins */}
      <QuickWins quickWins={plan.quickWins} />

      {/* Monthly Checkpoint Timeline */}
      {plan.monthlyCheckpoints.length > 0 && (
        <div className="rounded-lg border border-border bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Monthly Checkpoints
          </h3>
          <div className="space-y-4">
            {plan.monthlyCheckpoints.map((checkpoint, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {checkpoint.month}
                  </div>
                  {i < plan.monthlyCheckpoints.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Month {checkpoint.month}
                  </p>
                  <div className="space-y-1">
                    {checkpoint.focusAreas.map((area, j) => (
                      <p key={j} className="text-sm text-muted-foreground">
                        <span className="text-blue-500 mr-1">→</span>
                        {area}
                      </p>
                    ))}
                  </div>
                  {checkpoint.expectedOutcomes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {checkpoint.expectedOutcomes.map((outcome, j) => (
                        <p key={j} className="text-sm text-green-700">
                          <span className="mr-1">✓</span>
                          {outcome}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
