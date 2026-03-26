"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { competencies, CompetencyKey } from "@/config/competencies";

interface RadarChartProps {
  currentLevels: Record<CompetencyKey, number>;
  targetLevels: Record<CompetencyKey, number>;
  weights: Record<CompetencyKey, number>;
}

export function RadarChart({
  currentLevels,
  targetLevels,
  weights,
}: RadarChartProps) {
  const data = (Object.keys(competencies) as CompetencyKey[]).map((key) => ({
    subject: `${competencies[key].name} (${weights[key] ?? 0}%)`,
    current: currentLevels[key] ?? 0,
    target: targetLevels[key] ?? 0,
    fullMark: 5,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <Tooltip
            formatter={(value, name) => [
              `Level ${value}`,
              name === "current" ? "Current" : "Target",
            ]}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.1}
          />
          <Legend />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
