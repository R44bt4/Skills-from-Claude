import { competencies, CompetencyKey } from "@/config/competencies";
import { LEVEL_ADVANCEMENT_THRESHOLD, MAX_LEVEL } from "@/config/scoring";

type ScoreValue = 0 | 1 | 2;
type CompetencyScores = Record<string, Record<string, ScoreValue>>;

/**
 * Compute the highest achieved level for a competency.
 * Level advancement requires:
 * 1. Previous level reached (sequential)
 * 2. No skill at the target level scored 0
 * 3. Average score at the target level > 1.7
 *
 * Returns: 0-5 (highest reached level)
 * Note: Level 0 is the base. To "reach" level N means levels 0 through N are all passed.
 * If level 0 skills don't meet the threshold, returns 0 (starter).
 */
export function computeCompetencyLevel(
  scores: CompetencyScores,
  competencyKey: CompetencyKey
): number {
  const comp = competencies[competencyKey];
  let currentLevel = -1; // -1 means nothing passed yet

  for (let levelIdx = 0; levelIdx <= MAX_LEVEL; levelIdx++) {
    const levelScores = scores[String(levelIdx)];
    if (!levelScores) break;

    const level = comp.levels[levelIdx];
    const skillValues: number[] = [];

    for (let i = 0; i < level.skills.length; i++) {
      const score = levelScores[String(i)];
      if (score === undefined) break;
      skillValues.push(score);
    }

    if (skillValues.length === 0) break;

    // Check: no skill is 0
    if (skillValues.some((v) => v === 0)) break;

    // Check: average > 1.7
    const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
    if (avg <= LEVEL_ADVANCEMENT_THRESHOLD) break;

    // Check: previous level was reached (sequential advancement)
    if (levelIdx > 0 && currentLevel < levelIdx - 1) break;

    currentLevel = levelIdx;
  }

  return Math.max(0, currentLevel);
}

/**
 * Compute career progress as weighted average of competency levels.
 * Returns: 0-5 float
 */
export function computeCareerProgress(
  levels: Record<CompetencyKey, number>,
  weights: Record<CompetencyKey, number>
): number {
  let sum = 0;
  let totalWeight = 0;

  for (const [key, level] of Object.entries(levels)) {
    const weight = weights[key as CompetencyKey] || 0;
    sum += level * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? sum / totalWeight : 0;
}

export interface GapItem {
  competency: CompetencyKey;
  currentLevel: number;
  targetLevel: number;
  roleWeight: number;
  impactScore: number; // weight * gap size
  skills: { skill: string; currentScore: number; level: number }[];
  isMaxLevel: boolean;
}

/**
 * Compute gap analysis: identify skills blocking advancement.
 * For each competency not at level 5, look at skills at (currentLevel + 1) scoring 0 or 1.
 * Sort by (roleWeight × number of gaps) descending.
 * For level 5 competencies, return with empty skills (lateral growth).
 */
export function computeGapAnalysis(
  levels: Record<CompetencyKey, number>,
  weights: Record<CompetencyKey, number>,
  scores: Record<string, Record<string, Record<string, ScoreValue>>>
): GapItem[] {
  const gaps: GapItem[] = [];

  for (const [key, level] of Object.entries(levels)) {
    const competencyKey = key as CompetencyKey;
    const weight = weights[competencyKey] || 0;

    if (level >= MAX_LEVEL) {
      // At max level — lateral growth
      gaps.push({
        competency: competencyKey,
        currentLevel: level,
        targetLevel: level,
        roleWeight: weight,
        impactScore: 0,
        skills: [],
        isMaxLevel: true,
      });
      continue;
    }

    const targetLevel = level + 1;
    const comp = competencies[competencyKey];
    const targetLevelDef = comp.levels[targetLevel];
    const competencyScores = scores[key];
    const levelScores = competencyScores?.[String(targetLevel)];

    const skillGaps: { skill: string; currentScore: number; level: number }[] =
      [];

    if (targetLevelDef && levelScores) {
      for (let i = 0; i < targetLevelDef.skills.length; i++) {
        const score = levelScores[String(i)] ?? 0;
        if (score < 2) {
          skillGaps.push({
            skill: targetLevelDef.skills[i],
            currentScore: score,
            level: targetLevel,
          });
        }
      }
    }

    gaps.push({
      competency: competencyKey,
      currentLevel: level,
      targetLevel,
      roleWeight: weight,
      impactScore: weight * skillGaps.length,
      skills: skillGaps,
      isMaxLevel: false,
    });
  }

  // Sort by impact score descending
  gaps.sort((a, b) => b.impactScore - a.impactScore);

  return gaps;
}
