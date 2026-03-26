import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN");

    const employee = await prisma.employee.findUnique({ where: { id: params.id } });
    if (!employee) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Employee not found", 404);
    }

    const body = await req.json();
    const { name, role, careerTrack, managerId } = body;

    const validRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];
    if (role && !validRoles.includes(role)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `role must be one of: ${validRoles.join(", ")}`, 400);
    }

    if (managerId !== undefined && managerId !== null) {
      const manager = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!manager) {
        throw new ApiError(ErrorCodes.NOT_FOUND, "Manager not found", 404);
      }
      // Prevent self-assignment as manager
      if (managerId === params.id) {
        throw new ApiError(ErrorCodes.VALIDATION_ERROR, "An employee cannot be their own manager", 400);
      }
    }

    const updated = await prisma.employee.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(careerTrack !== undefined && { careerTrack }),
        ...(managerId !== undefined && { managerId: managerId || null }),
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (err) {
    return handleApiError(err);
  }
}
