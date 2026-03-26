import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { computeGapAnalysis } from "./scoring-engine";
import { GrowthPlanContentSchema } from "./validations";
import { CompetencyKey } from "@/config/competencies";
import { roles, RoleKey } from "@/config/roles";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function buildGrowthPlanPrompt(
  employeeName: string,
  roleName: string,
  roleDescription: string,
  weights: Record<CompetencyKey, number>,
  currentLevels: Record<CompetencyKey, number>,
  gapAnalysis: ReturnType<typeof computeGapAnalysis>
) {
  const systemMessage = `You are an expert career development coach specializing in IT Operations roles.
Generate a detailed 6-month personal growth plan in JSON format.

The JSON must match this exact structure:
{
  "summary": "One paragraph overview of the growth plan",
  "currentProgress": <number 0-5>,
  "targetProgress": <number 0-5>,
  "timelineMonths": 6,
  "priorities": [
    {
      "rank": <number>,
      "competency": "<competency key>",
      "currentLevel": <number>,
      "targetLevel": <number>,
      "roleWeight": <number>,
      "skills": [{"skill": "<text>", "currentScore": <0|1>, "level": <number>}],
      "phases": [
        {"name": "Foundation", "months": "1-2", "actions": ["..."], "deliverables": ["..."]},
        {"name": "Practice", "months": "3-4", "actions": ["..."], "deliverables": ["..."]},
        {"name": "Demonstrate", "months": "5-6", "actions": ["..."], "deliverables": ["..."]}
      ],
      "resources": [{"type": "book|course|certification|practice|internal", "title": "...", "description": "...", "relevance": "..."}]
    }
  ],
  "quickWins": [{"competency": "...", "skill": "...", "currentScore": 1, "action": "...", "timeframe": "Immediate|2 weeks"}],
  "monthlyCheckpoints": [{"month": 1, "focusAreas": ["..."], "expectedOutcomes": ["..."]}]
}

Rules:
- Priorities MUST be sorted by (roleWeight × number of skill gaps) descending
- Each phase must have 3-5 concrete, actionable items specific to IT Operations
- Actions must be specific (not generic advice) — reference actual tools, frameworks, certifications
- Quick wins are skills scored 1 that need consistency, not new learning
- Include 6 monthly checkpoints
- Resources should be real books, courses, and certifications relevant to IT Ops`;

  const userMessage = `Generate a growth plan for:
Role: ${roleName} — ${roleDescription}
Employee: ${employeeName}

Competency Weights: ${JSON.stringify(weights)}
Current Levels: ${JSON.stringify(currentLevels)}

Skill Gaps (sorted by priority):
${gapAnalysis
  .filter((g) => g.skills.length > 0)
  .map(
    (g) =>
      `${g.competency} (weight: ${g.roleWeight}%, current: ${g.currentLevel}, target: ${g.targetLevel}):
${g.skills.map((s) => `  - "${s.skill}" (score: ${s.currentScore}/2)`).join("\n")}`
  )
  .join("\n\n")}

${
  gapAnalysis.some((g) => g.isMaxLevel)
    ? `\nCompetencies at max level (suggest lateral growth): ${gapAnalysis
        .filter((g) => g.isMaxLevel)
        .map((g) => g.competency)
        .join(", ")}`
    : ""
}`;

  return { systemMessage, userMessage };
}

export function parseGrowthPlanResponse(rawResponse: string) {
  const parsed = JSON.parse(rawResponse);
  return GrowthPlanContentSchema.parse(parsed);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGrowthPlan(calibrationId: string) {
  // 1. Load CalibrationResult + SelfAssessment + Employee
  const calibration = await prisma.calibrationResult.findUnique({
    where: { id: calibrationId },
    include: {
      assessment: {
        include: {
          employee: true,
          cycle: true,
        },
      },
    },
  });

  if (!calibration) {
    throw new Error(`CalibrationResult not found: ${calibrationId}`);
  }

  const employee = calibration.assessment.employee;
  const cycle = calibration.assessment.cycle;

  // 2. Parse finalScores, compute gap analysis
  const finalScores = JSON.parse(calibration.finalScores) as Record<
    string,
    Record<string, Record<string, 0 | 1 | 2>>
  >;
  const finalLevels = JSON.parse(calibration.finalLevels) as Record<
    CompetencyKey,
    number
  >;

  // Get role config
  const roleKey = employee.careerTrack as RoleKey;
  const role = roles[roleKey];
  if (!role) {
    throw new Error(`Unknown role: ${roleKey}`);
  }

  const gapAnalysis = computeGapAnalysis(
    finalLevels,
    role.weights as Record<CompetencyKey, number>,
    finalScores
  );

  // 3. Build prompt
  const { systemMessage, userMessage } = buildGrowthPlanPrompt(
    employee.name,
    role.name,
    role.description,
    role.weights as Record<CompetencyKey, number>,
    finalLevels,
    gapAnalysis
  );

  // 4. Create a placeholder GrowthPlan with GENERATING status
  // Check if there's an existing plan to determine version
  const existingPlans = await prisma.growthPlan.findMany({
    where: { calibrationId },
    orderBy: { version: "desc" },
    take: 1,
  });
  const nextVersion =
    existingPlans.length > 0 ? existingPlans[0].version + 1 : 1;

  const growthPlan = await prisma.growthPlan.create({
    data: {
      calibrationId,
      employeeId: employee.id,
      cycleId: cycle.id,
      version: nextVersion,
      status: "GENERATING",
      content: "{}",
      rawLlmResponse: "",
    },
  });

  // 5. Call Anthropic Claude with retries
  const maxRetries = 3;
  const backoffMs = [2000, 8000, 32000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemMessage,
        messages: [
          { role: "user", content: userMessage },
        ],
      });

      const rawLlmResponse = response.content[0]?.type === "text" ? response.content[0].text : "";

      // 6. Parse and validate response
      const content = parseGrowthPlanResponse(rawLlmResponse);

      // 7. Save with READY status
      const updatedPlan = await prisma.growthPlan.update({
        where: { id: growthPlan.id },
        data: {
          status: "READY",
          content: JSON.stringify(content),
          rawLlmResponse,
        },
      });

      return updatedPlan;
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await sleep(backoffMs[attempt]);
        continue;
      }

      // All retries exhausted — mark as FAILED
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during generation";
      await prisma.growthPlan.update({
        where: { id: growthPlan.id },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });

      throw err;
    }
  }

  // Should never reach here, but TypeScript needs a return
  throw new Error("generateGrowthPlan: unexpected end of function");
}
