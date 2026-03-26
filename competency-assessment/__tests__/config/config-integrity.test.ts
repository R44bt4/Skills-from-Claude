import { describe, it, expect } from "vitest";
import { competencies, CompetencyKey } from "@/config/competencies";
import { roles } from "@/config/roles";

describe("competencies config", () => {
  it("has exactly 6 competencies", () => {
    expect(Object.keys(competencies)).toHaveLength(6);
  });

  it("each competency has exactly 6 levels (0-5)", () => {
    for (const [key, comp] of Object.entries(competencies)) {
      expect(comp.levels).toHaveLength(6);
      comp.levels.forEach((level, i) => {
        expect(level.index).toBe(i);
      });
    }
  });

  it("each level has 4-6 skill statements", () => {
    for (const [key, comp] of Object.entries(competencies)) {
      for (const level of comp.levels) {
        expect(level.skills.length).toBeGreaterThanOrEqual(4);
        expect(level.skills.length).toBeLessThanOrEqual(6);
      }
    }
  });

  it("no empty skill statements", () => {
    for (const comp of Object.values(competencies)) {
      for (const level of comp.levels) {
        for (const skill of level.skills) {
          expect(skill.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("roles config", () => {
  it("has exactly 8 roles", () => {
    expect(Object.keys(roles)).toHaveLength(8);
  });

  it("each role weights sum to 100", () => {
    for (const [key, role] of Object.entries(roles)) {
      const sum = Object.values(role.weights).reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    }
  });

  it("each role has weights for all 6 competencies", () => {
    const competencyKeys = Object.keys(competencies);
    for (const [key, role] of Object.entries(roles)) {
      for (const ck of competencyKeys) {
        expect(role.weights).toHaveProperty(ck);
        expect(role.weights[ck as CompetencyKey]).toBeGreaterThan(0);
      }
    }
  });
});
