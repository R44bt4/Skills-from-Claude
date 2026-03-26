"use client";

import { cn } from "@/lib/utils";

interface DeltaIndicatorProps {
  delta: number;
}

export function DeltaIndicator({ delta }: DeltaIndicatorProps) {
  const abs = Math.abs(delta);

  const colorClass =
    abs === 0
      ? "bg-green-100 text-green-700"
      : abs === 1
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  const label =
    delta === 0 ? "0" : delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold min-w-[2rem]",
        colorClass
      )}
    >
      {label}
    </span>
  );
}
