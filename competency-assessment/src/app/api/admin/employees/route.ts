import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { hashSync } from "bcryptjs";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Strip password hashes from the response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safe = employees.map(({ passwordHash: _ph, ...emp }) => emp);

    return NextResponse.json(safe);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json();
    const { email, name, password, role, careerTrack, managerId } = body;

    if (!email || !name || !password || !role || !careerTrack) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        "email, name, password, role, and careerTrack are required",
        400
      );
    }

    const validRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];
    if (!validRoles.includes(role)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `role must be one of: ${validRoles.join(", ")}`, 400);
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(ErrorCodes.ALREADY_EXISTS, "An employee with this email already exists", 409);
    }

    if (managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!manager) {
        throw new ApiError(ErrorCodes.NOT_FOUND, "Manager not found", 404);
      }
    }

    const passwordHash = hashSync(password, 10);

    const employee = await prisma.employee.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        careerTrack,
        managerId: managerId || null,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph2, ...safe } = employee;
    return NextResponse.json(safe, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
