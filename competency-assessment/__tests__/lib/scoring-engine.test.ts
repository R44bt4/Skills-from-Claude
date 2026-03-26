import { describe, it, expect } from "vitest";
import { computeCompetencyLevel, computeCareerProgress, computeGapAnalysis } from "@/lib/scoring-engine";
import { buildScores, buildFullScores } from "@/lib/test-helpers";
import { CompetencyKey } from "@/config/competencies";

describe("computeCompetencyLevel", () => {
  it("returns 0 when level 0 skills are all zeros", () => {
    const scores = buildScores("delivery", { allDefault: 0 });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(0);
  });

  it("returns 0 when only level 0 is passed (level 0 is base, reaching it means you've completed level 0)", () => {
    const scores = buildScores("delivery", { passLevels: [0] });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(0);
  });

  it("returns 1 when levels 0 and 1 are fully passed", () => {
    const scores = buildScores("delivery", { passLevels: [0, 1] });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(1);
  });

  it("returns 2 when levels 0, 1, and 2 are fully passed", () => {
    const scores = buildScores("delivery", { passLevels: [0, 1, 2] });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(2);
  });

  it("does not advance if any skill at target level is 0", () => {
    // Pass level 0, but level 1 has one skill at 0
    const scores = buildScores("delivery", {
      passLevels: [0],
      overrides: { "1": { "0": 2, "1": 0, "2": 2, "3": 2 } }
    });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(0);
  });

  it("does not advance if average at target level is below 1.7", () => {
    // Pass level 0, level 1 all scores are 1 (avg=1.0, below 1.7) but no zeros
    const scores = buildScores("delivery", {
      passLevels: [0],
      overrides: { "1": { "0": 1, "1": 1, "2": 1, "3": 1 } }
    });
    // Avg is 1.0, all non-zero but below 1.7
    expect(computeCompetencyLevel(scores, "delivery")).toBe(0);
  });

  it("advances when average is exactly above 1.7", () => {
    // Pass level 0, level 1 has mostly 2s with one 1 — avg should be > 1.7
    // Delivery level 1 has 5 skills. 4 scores of 2 + 1 score of 1 = avg 1.8
    const scores = buildScores("delivery", {
      passLevels: [0],
      overrides: { "1": { "0": 2, "1": 2, "2": 2, "3": 2, "4": 1 } }
    });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(1);
  });

  it("cannot skip levels — level 2 not reached if level 1 not passed", () => {
    // Level 0 passes, level 1 fails, level 2 all 2s — should still be 0
    const scores = buildScores("delivery", {
      passLevels: [0, 2], // level 1 not in passLevels, so all 0s there
    });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(0);
  });

  it("returns 5 when all levels passed", () => {
    const scores = buildScores("delivery", { passLevels: [0, 1, 2, 3, 4, 5] });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(5);
  });
});

describe("computeCareerProgress", () => {
  it("computes weighted average correctly", () => {
    const levels: Record<CompetencyKey, number> = {
      delivery: 3, domainExpertise: 2, problemSolving: 2,
      communication: 3, leadership: 1, aiSupremacy: 2,
    };
    const weights: Record<CompetencyKey, number> = {
      delivery: 20, domainExpertise: 25, problemSolving: 25,
      communication: 10, leadership: 5, aiSupremacy: 15,
    };
    // (3*20 + 2*25 + 2*25 + 3*10 + 1*5 + 2*15) / 100 = (60+50+50+30+5+30)/100 = 2.25
    expect(computeCareerProgress(levels, weights)).toBeCloseTo(2.25);
  });

  it("returns 0 for all-zero levels", () => {
    const levels: Record<CompetencyKey, number> = {
      delivery: 0, domainExpertise: 0, problemSolving: 0,
      communication: 0, leadership: 0, aiSupremacy: 0,
    };
    const weights: Record<CompetencyKey, number> = {
      delivery: 20, domainExpertise: 25, problemSolving: 25,
      communication: 10, leadership: 5, aiSupremacy: 15,
    };
    expect(computeCareerProgress(levels, weights)).toBe(0);
  });

  it("returns 5 for all level-5", () => {
    const levels: Record<CompetencyKey, number> = {
      delivery: 5, domainExpertise: 5, problemSolving: 5,
      communication: 5, leadership: 5, aiSupremacy: 5,
    };
    const weights: Record<CompetencyKey, number> = {
      delivery: 20, domainExpertise: 25, problemSolving: 25,
      communication: 10, leadership: 5, aiSupremacy: 15,
    };
    expect(computeCareerProgress(levels, weights)).toBe(5);
  });
});

describe("computeGapAnalysis", () => {
  it("returns gaps sorted by weight * gap size descending", () => {
    const levels: Record<CompetencyKey, number> = {
      delivery: 2, domainExpertise: 1, problemSolving: 1,
      communication: 2, leadership: 2, aiSupremacy: 1,
    };
    const weights: Record<CompetencyKey, number> = {
      delivery: 20, domainExpertise: 25, problemSolving: 30,
      communication: 10, leadership: 5, aiSupremacy: 15,
    };
    // Build scores where skills at next level have some gaps
    const fullScores = buildFullScores({
      delivery: { passLevels: [0, 1, 2], overrides: { "3": { "0": 0, "1": 1 } } },
      domainExpertise: { passLevels: [0, 1], overrides: { "2": { "0": 0, "1": 1 } } },
      problemSolving: { passLevels: [0, 1], overrides: { "2": { "0": 0, "1": 0 } } },
      communication: { passLevels: [0, 1, 2], overrides: { "3": { "0": 1 } } },
      leadership: { passLevels: [0, 1, 2], overrides: { "3": { "0": 1 } } },
      aiSupremacy: { passLevels: [0, 1], overrides: { "2": { "0": 1, "1": 0 } } },
    });
    const gaps = computeGapAnalysis(levels, weights, fullScores);
    // problemSolving has weight 30 and more gaps — should be first
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps[0].competency).toBe("problemSolving");
  });

  it("returns empty skills array for level 5 competencies (lateral growth)", () => {
    const levels: Record<CompetencyKey, number> = {
      delivery: 5, domainExpertise: 5, problemSolving: 5,
      communication: 5, leadership: 5, aiSupremacy: 5,
    };
    const weights: Record<CompetencyKey, number> = {
      delivery: 20, domainExpertise: 25, problemSolving: 25,
      communication: 10, leadership: 5, aiSupremacy: 15,
    };
    const gaps = computeGapAnalysis(levels, weights, {});
    // All at level 5 — gaps should have no skill gaps, but may have lateral suggestions
    for (const gap of gaps) {
      expect(gap.skills).toHaveLength(0);
    }
  });
});
