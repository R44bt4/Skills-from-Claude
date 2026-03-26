import { GrowthPlanContent } from "@/lib/validations";
import { competencies } from "@/config/competencies";

type QuickWin = GrowthPlanContent["quickWins"][number];

interface QuickWinsProps {
  quickWins: QuickWin[];
}

export function QuickWins({ quickWins }: QuickWinsProps) {
  if (quickWins.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-green-400 bg-white p-4 space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Quick Wins</h3>
        <p className="text-sm text-muted-foreground">
          Skills you already partially have — just need consistency
        </p>
      </div>
      <ul className="space-y-3">
        {quickWins.map((win, i) => {
          const compName =
            competencies[win.competency as keyof typeof competencies]?.name ??
            win.competency;
          return (
            <li
              key={i}
              className="flex items-start gap-3 rounded border border-green-100 bg-green-50 px-3 py-2"
            >
              <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full bg-green-100 text-xs font-bold text-green-700 flex items-center justify-center">
                {win.currentScore}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {win.skill}
                </p>
                <p className="text-xs text-muted-foreground">{compName}</p>
                <p className="text-sm text-foreground mt-1">{win.action}</p>
                <span className="mt-1 inline-block text-xs font-semibold text-green-700 bg-green-100 rounded px-1.5 py-0.5">
                  {win.timeframe}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
