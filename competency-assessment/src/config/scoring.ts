export const LEVEL_ADVANCEMENT_THRESHOLD = 1.7;
export const MAX_LEVEL = 5;
export const SCORE_VALUES = [0, 1, 2] as const;
export type ScoreValue = (typeof SCORE_VALUES)[number];
export const LEVEL_NAMES = [
  "Starter",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Leading Expert",
] as const;
