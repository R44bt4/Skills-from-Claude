import { describe, it, expect } from "vitest";
import { checkRoleHierarchy, isManagerOf } from "@/lib/auth-helpers";

describe("checkRoleHierarchy", () => {
  it("allows ADMIN for ADMIN-required route", () => {
    expect(checkRoleHierarchy("ADMIN", "ADMIN")).toBe(true);
  });

  it("allows ADMIN for MANAGER-required route", () => {
    expect(checkRoleHierarchy("ADMIN", "MANAGER")).toBe(true);
  });

  it("allows ADMIN for EMPLOYEE-required route", () => {
    expect(checkRoleHierarchy("ADMIN", "EMPLOYEE")).toBe(true);
  });

  it("allows MANAGER for EMPLOYEE-required route", () => {
    expect(checkRoleHierarchy("MANAGER", "EMPLOYEE")).toBe(true);
  });

  it("allows MANAGER for MANAGER-required route", () => {
    expect(checkRoleHierarchy("MANAGER", "MANAGER")).toBe(true);
  });

  it("rejects EMPLOYEE for MANAGER-required route", () => {
    expect(checkRoleHierarchy("EMPLOYEE", "MANAGER")).toBe(false);
  });

  it("rejects EMPLOYEE for ADMIN-required route", () => {
    expect(checkRoleHierarchy("EMPLOYEE", "ADMIN")).toBe(false);
  });

  it("rejects MANAGER for ADMIN-required route", () => {
    expect(checkRoleHierarchy("MANAGER", "ADMIN")).toBe(false);
  });
});
