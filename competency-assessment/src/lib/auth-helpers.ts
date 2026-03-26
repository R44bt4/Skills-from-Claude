import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { ApiError, ErrorCodes } from "./errors";

const ROLE_HIERARCHY = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 } as const;

export function checkRoleHierarchy(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] ?? 999;
  return userLevel >= requiredLevel;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new ApiError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401);
  }
  return session.user;
}

export async function requireRole(minRole: "EMPLOYEE" | "MANAGER" | "ADMIN") {
  const user = await requireAuth();
  if (!checkRoleHierarchy(user.role, minRole)) {
    throw new ApiError(ErrorCodes.FORBIDDEN, `Requires ${minRole} role or higher`, 403);
  }
  return user;
}

export async function requireManagerOf(employeeId: string) {
  const user = await requireAuth();
  // Admin can access any employee
  if (user.role === "ADMIN") return user;
  // Manager must be the direct manager
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee || employee.managerId !== user.id) {
    throw new ApiError(ErrorCodes.FORBIDDEN, "Not authorized for this employee", 403);
  }
  return user;
}

export async function isManagerOf(managerId: string, employeeId: string): Promise<boolean> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  return employee?.managerId === managerId;
}
