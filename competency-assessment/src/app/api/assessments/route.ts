import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function POST() {
  try {
    const user = await requireAuth();

    const cycle = await prisma.assessmentCycle.findFirst({
      where: { status: "OPEN" },
    });

    if (!cycle) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "No active assessment cycle", 404);
    }

    const existing = await prisma.selfAssessment.findUnique({
      where: {
        employeeId_cycleId: {
          employeeId: user.id,
          cycleId: cycle.id,
        },
      },
    });

    if (existing) {
      throw new ApiError(
        ErrorCodes.ALREADY_EXISTS,
        "Assessment already exists for this cycle",
        409
      );
    }

    const assessment = await prisma.selfAssessment.create({
      data: {
        employeeId: user.id,
        cycleId: cycle.id,
        scores: JSON.stringify({}),
        status: "DRAFT",
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
