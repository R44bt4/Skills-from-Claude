"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkillRaterProps {
  skillText: string;
  value: 0 | 1 | 2 | undefined;
  onChange: (value: 0 | 1 | 2) => void;
}

const RATING_OPTIONS: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: "0 — No" },
  { value: 1, label: "1 — Somewhat" },
  { value: 2, label: "2 — Yes" },
];

export function SkillRater({ skillText, value, onChange }: SkillRaterProps) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-border last:border-b-0">
      <p className="text-sm text-foreground">{skillText}</p>
      <div className="flex gap-2 flex-wrap">
        {RATING_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              "transition-colors",
              value === option.value &&
                "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-700"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
