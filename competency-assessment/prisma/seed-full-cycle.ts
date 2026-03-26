/**
 * Seeds a complete assessment cycle with a sample growth plan for Alex Engineer.
 * Run after the base seed: DATABASE_URL="file:./dev.db" npx tsx prisma/seed-full-cycle.ts
 */
import { PrismaClient } from "@prisma/client";
import { computeCompetencyLevel, computeCareerProgress, computeGapAnalysis } from "../src/lib/scoring-engine";
import { competencies, CompetencyKey } from "../src/config/competencies";
import { roles } from "../src/config/roles";

const prisma = new PrismaClient();

// Build realistic scores for an IT Infrastructure Engineer at ~Level 2
function buildSampleScores(): Record<string, Record<string, Record<string, number>>> {
  const scores: Record<string, Record<string, Record<string, number>>> = {};

  for (const [compKey, comp] of Object.entries(competencies)) {
    scores[compKey] = {};
    for (const level of comp.levels) {
      scores[compKey][String(level.index)] = {};
      for (let i = 0; i < level.skills.length; i++) {
        let score: number;
        if (level.index <= 1) {
          // Levels 0-1: mostly mastered
          score = 2;
        } else if (level.index === 2) {
          // Level 2: mixed — some 2s, some 1s, occasional 0
          score = i % 3 === 0 ? 1 : i % 5 === 0 ? 0 : 2;
        } else if (level.index === 3) {
          // Level 3: mostly gaps
          score = i % 2 === 0 ? 1 : 0;
        } else {
          // Levels 4-5: all gaps
          score = 0;
        }
        scores[compKey][String(level.index)][String(i)] = score;
      }
    }
  }
  return scores;
}

// Build a realistic sample growth plan content
function buildSampleGrowthPlan(
  currentLevels: Record<string, number>,
  gaps: ReturnType<typeof computeGapAnalysis>
) {
  const priorities = gaps
    .filter((g) => g.skills.length > 0)
    .slice(0, 3)
    .map((g, idx) => ({
      rank: idx + 1,
      competency: g.competency,
      currentLevel: g.currentLevel,
      targetLevel: g.targetLevel,
      roleWeight: g.roleWeight,
      skills: g.skills.map((s) => ({
        skill: s.skill,
        currentScore: s.currentScore,
        level: s.level,
      })),
      phases: [
        {
          name: "Foundation",
          months: "1-2",
          actions: [
            `Shadow senior engineers during ${g.competency === "problemSolving" ? "architecture reviews" : g.competency === "delivery" ? "project planning sessions" : g.competency === "domainExpertise" ? "infrastructure deep-dives" : g.competency === "aiSupremacy" ? "AI tool evaluations" : "team retrospectives"}`,
            `Complete relevant training: ${g.competency === "domainExpertise" ? "AWS Solutions Architect Associate prep" : g.competency === "problemSolving" ? "\"Designing Data-Intensive Applications\" chapters 1-4" : g.competency === "aiSupremacy" ? "Anthropic prompt engineering course" : g.competency === "communication" ? "Technical writing workshop" : "Leadership fundamentals course"}`,
            `Document 3 ${g.competency === "delivery" ? "project risk assessments" : g.competency === "problemSolving" ? "root cause analyses" : "knowledge base articles"} and share with team`,
            "Set up bi-weekly check-ins with mentor to review progress",
          ],
          deliverables: [
            `Completed ${g.competency === "domainExpertise" ? "certification study plan" : "learning journal"} with key takeaways`,
            `3 documented ${g.competency === "problemSolving" ? "failure mode analyses" : "process improvements"} shared with team`,
          ],
        },
        {
          name: "Practice",
          months: "3-4",
          actions: [
            `Lead ${g.competency === "problemSolving" ? "2 incident post-mortems with documented root cause analysis" : g.competency === "delivery" ? "a cross-team infrastructure project end-to-end" : g.competency === "domainExpertise" ? "a tool evaluation comparing 2 alternatives with evidence-based recommendation" : g.competency === "aiSupremacy" ? "an AI-augmented workflow pilot for the team" : "a team knowledge-sharing session"}`,
            `Design and propose a ${g.competency === "problemSolving" ? "capacity plan for one critical service" : g.competency === "delivery" ? "monitoring and alerting strategy for your systems" : g.competency === "domainExpertise" ? "infrastructure improvement roadmap" : "process optimization initiative"}`,
            `Take on one ambiguous project requiring ${g.competency === "problemSolving" ? "problem decomposition" : "cross-team coordination"} — practice breaking it into concrete steps`,
            "Present findings to team and gather feedback",
          ],
          deliverables: [
            `Written ${g.competency === "problemSolving" ? "design doc for a medium-complexity infrastructure change" : "project plan with dependencies and milestones"} reviewed by senior peer`,
            `Completed ${g.competency === "domainExpertise" ? "tool evaluation report" : "project milestone"} with measurable outcomes`,
          ],
        },
        {
          name: "Demonstrate",
          months: "5-6",
          actions: [
            `Own the ${g.competency === "problemSolving" ? "design phase of a cross-team infrastructure project" : g.competency === "delivery" ? "delivery of an end-to-end project with SLO tracking" : g.competency === "domainExpertise" ? "implementation of a new technology based on your evaluation" : "rollout of your AI workflow to 2+ teams"}`,
            `Proactively identify and document 3 ${g.competency === "problemSolving" ? "operational risks in current systems with proposed mitigations" : "improvement opportunities"} and present to leadership`,
            `Mentor a junior team member on ${g.competency} skills for 4+ weeks`,
            "Compile evidence portfolio demonstrating Level 3 competency",
          ],
          deliverables: [
            `Completed project with evidence of ${g.competency === "problemSolving" ? "scalability thinking (load testing, capacity projections)" : "operational excellence"}`,
            "Evidence portfolio ready for next assessment cycle",
          ],
        },
      ],
      resources: [
        {
          type: "book" as const,
          title: g.competency === "problemSolving"
            ? "Designing Data-Intensive Applications"
            : g.competency === "delivery"
            ? "The Phoenix Project"
            : g.competency === "domainExpertise"
            ? "Infrastructure as Code (2nd Edition)"
            : g.competency === "aiSupremacy"
            ? "AI Engineering by Chip Huyen"
            : "The Manager's Path",
          description: g.competency === "problemSolving"
            ? "Martin Kleppmann's guide to distributed systems design — essential for scalability thinking"
            : g.competency === "delivery"
            ? "Kim, Behr, Spafford — DevOps principles through narrative"
            : g.competency === "domainExpertise"
            ? "Kief Morris — modern IaC patterns with Terraform, Pulumi, and cloud-native tools"
            : g.competency === "aiSupremacy"
            ? "Practical guide to building AI-powered systems and evaluating AI tools"
            : "Camille Fournier — technical leadership and management fundamentals",
          relevance: `Directly addresses ${g.skills[0]?.skill ?? "key skill gaps"} at Level ${g.targetLevel}`,
        },
        {
          type: "certification" as const,
          title: g.competency === "domainExpertise"
            ? "AWS Solutions Architect Associate"
            : g.competency === "problemSolving"
            ? "Google Professional Cloud Architect"
            : g.competency === "aiSupremacy"
            ? "Anthropic Prompt Engineering Certification"
            : "ITIL 4 Foundation",
          description: "Industry-recognized certification validating expertise in this domain",
          relevance: `Demonstrates Level ${g.targetLevel} ${g.competency} mastery to stakeholders`,
        },
        {
          type: "practice" as const,
          title: g.competency === "problemSolving"
            ? "Weekly architecture kata exercises"
            : g.competency === "delivery"
            ? "SLO definition and tracking practice"
            : "Peer code/design review participation",
          description: "Hands-on practice that builds skills through repetition and feedback",
          relevance: `Builds muscle memory for ${g.skills[0]?.skill ?? "target skills"}`,
        },
      ],
    }));

  // Quick wins from skills scored 1 at current+1 level
  const quickWins = gaps
    .flatMap((g) =>
      g.skills
        .filter((s) => s.currentScore === 1)
        .slice(0, 2)
        .map((s) => ({
          competency: g.competency,
          skill: s.skill,
          currentScore: 1,
          action: `Make this a daily habit: consistently ${s.skill.toLowerCase().replace(/^[a-z]/, (c) => c)}. Track for 30 days.`,
          timeframe: "Immediate" as const,
        }))
    )
    .slice(0, 5);

  const currentProgress = Object.values(currentLevels).reduce((a, b) => a + b, 0) / Object.keys(currentLevels).length;

  return {
    summary: `As an IT Infrastructure Engineer, your strongest areas are Delivery and Communication where you've reached Level 2. Your primary growth opportunities are in Problem Solving (30% weight) and Domain Expertise (25% weight), where targeted effort over 6 months can move you from Level 1 to Level 2-3. Focus on architecture thinking, evidence-based tool evaluation, and leading cross-team technical initiatives.`,
    currentProgress: Math.round(currentProgress * 100) / 100,
    targetProgress: Math.round((currentProgress + 0.8) * 100) / 100,
    timelineMonths: 6,
    priorities,
    quickWins,
    monthlyCheckpoints: [
      { month: 1, focusAreas: ["Learning foundations", "Setting up mentorship"], expectedOutcomes: ["Study plan created", "Mentor assigned", "First shadowing sessions completed"] },
      { month: 2, focusAreas: ["Deepening knowledge", "First deliverables"], expectedOutcomes: ["3 documented analyses shared", "Training materials 50% complete"] },
      { month: 3, focusAreas: ["Leading activities", "Applying knowledge"], expectedOutcomes: ["First project/review led", "Design doc drafted"] },
      { month: 4, focusAreas: ["Building evidence", "Mid-point review"], expectedOutcomes: ["Tool evaluation complete", "Mid-cycle progress check with manager"] },
      { month: 5, focusAreas: ["Owning projects", "Demonstrating mastery"], expectedOutcomes: ["Cross-team project underway", "Risk assessment presented to leadership"] },
      { month: 6, focusAreas: ["Completing deliverables", "Portfolio assembly"], expectedOutcomes: ["All projects delivered", "Evidence portfolio ready", "Certification exam scheduled or passed"] },
    ],
  };
}

async function main() {
  // Find Alex
  const alex = await prisma.employee.findUnique({ where: { email: "alex@company.com" } });
  const manager = await prisma.employee.findUnique({ where: { email: "manager@company.com" } });
  const admin = await prisma.employee.findUnique({ where: { email: "admin@company.com" } });
  if (!alex || !manager || !admin) throw new Error("Run base seed first");

  // Find or create a CLOSED cycle
  let cycle = await prisma.assessmentCycle.findFirst({ where: { status: "CLOSED" } });
  if (!cycle) {
    // Close existing open cycle or create new one
    const existing = await prisma.assessmentCycle.findFirst();
    if (existing) {
      cycle = await prisma.assessmentCycle.update({
        where: { id: existing.id },
        data: { status: "CLOSED" },
      });
    } else {
      cycle = await prisma.assessmentCycle.create({
        data: {
          name: "Q1 2026",
          status: "CLOSED",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-03-31"),
        },
      });
    }
  }

  // Build sample scores
  const scores = buildSampleScores();

  // Compute levels
  const computedLevels: Record<string, number> = {};
  for (const key of Object.keys(competencies) as CompetencyKey[]) {
    computedLevels[key] = computeCompetencyLevel(scores[key] || {}, key);
  }

  const roleConfig = roles["itInfrastructureEngineer"];
  const careerProgress = computeCareerProgress(
    computedLevels as Record<CompetencyKey, number>,
    roleConfig.weights as Record<CompetencyKey, number>
  );

  console.log("Computed levels:", computedLevels);
  console.log("Career progress:", careerProgress);

  // Upsert self-assessment
  const assessment = await prisma.selfAssessment.upsert({
    where: { employeeId_cycleId: { employeeId: alex.id, cycleId: cycle.id } },
    update: {
      scores: JSON.stringify(scores),
      computedLevels: JSON.stringify(computedLevels),
      careerProgress,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    create: {
      employeeId: alex.id,
      cycleId: cycle.id,
      scores: JSON.stringify(scores),
      computedLevels: JSON.stringify(computedLevels),
      careerProgress,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Upsert manager review (same scores, slight adjustments)
  const managerScores = JSON.parse(JSON.stringify(scores));
  // Manager adjusts a couple scores down
  if (managerScores.problemSolving?.["2"]?.["0"]) managerScores.problemSolving["2"]["0"] = 0;
  if (managerScores.delivery?.["2"]?.["1"]) managerScores.delivery["2"]["1"] = 1;

  const mgrLevels: Record<string, number> = {};
  for (const key of Object.keys(competencies) as CompetencyKey[]) {
    mgrLevels[key] = computeCompetencyLevel(managerScores[key] || {}, key);
  }
  const mgrProgress = computeCareerProgress(
    mgrLevels as Record<CompetencyKey, number>,
    roleConfig.weights as Record<CompetencyKey, number>
  );

  await prisma.managerReview.upsert({
    where: { assessmentId: assessment.id },
    update: {
      scores: JSON.stringify(managerScores),
      comments: JSON.stringify({
        delivery: "Good progress on operational tasks, needs more cross-team project experience.",
        problemSolving: "Shows analytical thinking but needs to lead more architecture decisions independently.",
      }),
      computedLevels: JSON.stringify(mgrLevels),
      careerProgress: mgrProgress,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    create: {
      assessmentId: assessment.id,
      reviewerId: manager.id,
      scores: JSON.stringify(managerScores),
      comments: JSON.stringify({
        delivery: "Good progress on operational tasks, needs more cross-team project experience.",
        problemSolving: "Shows analytical thinking but needs to lead more architecture decisions independently.",
      }),
      computedLevels: JSON.stringify(mgrLevels),
      careerProgress: mgrProgress,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Create calibration result (using manager levels as final)
  const calibration = await prisma.calibrationResult.upsert({
    where: { assessmentId: assessment.id },
    update: {
      finalScores: JSON.stringify(managerScores),
      finalLevels: JSON.stringify(mgrLevels),
      finalProgress: mgrProgress,
    },
    create: {
      assessmentId: assessment.id,
      calibratedById: admin.id,
      finalScores: JSON.stringify(managerScores),
      finalLevels: JSON.stringify(mgrLevels),
      finalProgress: mgrProgress,
    },
  });

  // Compute gap analysis for growth plan
  const gapAnalysis = computeGapAnalysis(
    mgrLevels as Record<CompetencyKey, number>,
    roleConfig.weights as Record<CompetencyKey, number>,
    managerScores
  );

  // Build and save growth plan
  const planContent = buildSampleGrowthPlan(mgrLevels, gapAnalysis);

  // Delete existing plans for this calibration
  await prisma.growthPlan.deleteMany({ where: { calibrationId: calibration.id } });

  await prisma.growthPlan.create({
    data: {
      calibrationId: calibration.id,
      employeeId: alex.id,
      cycleId: cycle.id,
      version: 1,
      status: "READY",
      content: JSON.stringify(planContent),
      rawLlmResponse: JSON.stringify(planContent),
    },
  });

  console.log("Full cycle seeded for Alex Engineer:");
  console.log("  Cycle:", cycle.name, "→ CLOSED");
  console.log("  Assessment: SUBMITTED");
  console.log("  Manager Review: SUBMITTED");
  console.log("  Calibration: Done");
  console.log("  Growth Plan: READY");
  console.log("  Career Progress:", mgrProgress.toFixed(2));
  console.log("  Levels:", mgrLevels);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
