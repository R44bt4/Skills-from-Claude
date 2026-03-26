import { competencies, CompetencyKey } from "@/config/competencies";
import type { ScoreValue } from "@/config/scoring";

/**
 * Build a scores object for a single competency.
 * - allDefault: set all skills to this value (0, 1, or 2)
 * - passLevels: set all skills in these levels to 2 (passing)
 * - overrides: specific overrides by level and skill index
 */
export function buildScores(
  competencyKey: CompetencyKey,
  opts: {
    allDefault?: ScoreValue;
    passLevels?: number[];
    overrides?: Record<string, Record<string, ScoreValue>>;
  } = {}
): Record<string, Record<string, ScoreValue>> {
  const comp = competencies[competencyKey];
  const scores: Record<string, Record<string, ScoreValue>> = {};

  for (const level of comp.levels) {
    const levelScores: Record<string, ScoreValue> = {};
    for (let i = 0; i < level.skills.length; i++) {
      let value: ScoreValue = opts.allDefault ?? 0;
      if (opts.passLevels?.includes(level.index)) {
        value = 2;
      }
      levelScores[String(i)] = value;
    }
    scores[String(level.index)] = levelScores;
  }

  // Apply overrides
  if (opts.overrides) {
    for (const [levelIdx, skills] of Object.entries(opts.overrides)) {
      if (!scores[levelIdx]) scores[levelIdx] = {};
      for (const [skillIdx, value] of Object.entries(skills)) {
        scores[levelIdx][skillIdx] = value;
      }
    }
  }

  return scores;
}

/**
 * Build a full scores object for ALL 6 competencies.
 */
export function buildFullScores(
  perCompetency: Partial<Record<CompetencyKey, Parameters<typeof buildScores>[1]>> = {}
): Record<string, Record<string, Record<string, ScoreValue>>> {
  const allKeys = Object.keys(competencies) as CompetencyKey[];
  const result: Record<string, Record<string, Record<string, ScoreValue>>> = {};

  for (const key of allKeys) {
    result[key] = buildScores(key, perCompetency[key] || { allDefault: 0 });
  }

  return result;
}
