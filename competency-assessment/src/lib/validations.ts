import { z } from "zod";

// Score value: 0, 1, or 2
const ScoreValueSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);

// Scores: Record<CompetencyKey, Record<LevelIndex, Record<SkillIndex, 0|1|2>>>
export const ScoresSchema = z.record(
  z.string(), // competency key
  z.record(
    z.string(), // level index as string
    z.record(
      z.string(), // skill index as string
      ScoreValueSchema
    )
  )
);

// Comments: Record<CompetencyKey, string>
export const CommentsSchema = z.record(z.string(), z.string());

// Levels: Record<CompetencyKey, number 0-5>
export const LevelsSchema = z.record(z.string(), z.number().min(0).max(5));

// Growth plan sub-schemas
const SkillGapSchema = z.object({
  skill: z.string(),
  currentScore: z.number(),
  level: z.number(),
});

const PhaseSchema = z.object({
  name: z.string(),
  months: z.string(),
  actions: z.array(z.string()),
  deliverables: z.array(z.string()),
});

const ResourceSchema = z.object({
  type: z.enum(["book", "course", "certification", "practice", "internal"]),
  title: z.string(),
  description: z.string(),
  relevance: z.string(),
});

const QuickWinSchema = z.object({
  competency: z.string(),
  skill: z.string(),
  currentScore: z.number(),
  action: z.string(),
  timeframe: z.string(),
});

const CheckpointSchema = z.object({
  month: z.number(),
  focusAreas: z.array(z.string()),
  expectedOutcomes: z.array(z.string()),
});

const PrioritySchema = z.object({
  rank: z.number(),
  competency: z.string(),
  currentLevel: z.number(),
  targetLevel: z.number(),
  roleWeight: z.number(),
  skills: z.array(SkillGapSchema),
  phases: z.array(PhaseSchema),
  resources: z.array(ResourceSchema),
});

export const GrowthPlanContentSchema = z.object({
  summary: z.string(),
  currentProgress: z.number(),
  targetProgress: z.number(),
  timelineMonths: z.number(),
  priorities: z.array(PrioritySchema),
  quickWins: z.array(QuickWinSchema),
  monthlyCheckpoints: z.array(CheckpointSchema),
});

// Type exports
export type Scores = z.infer<typeof ScoresSchema>;
export type GrowthPlanContent = z.infer<typeof GrowthPlanContentSchema>;
