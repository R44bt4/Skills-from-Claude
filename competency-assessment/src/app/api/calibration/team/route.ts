import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireRole("MANAGER");

    // Find active cycle in REVIEWING or CALIBRATING status
    const cycle = await prisma.assessmentCycle.findFirst({
      where: { status: { in: ["REVIEWING", "CALIBRATING"] } },
    });

    if (!cycle) {
      throw new ApiError(
        ErrorCodes.NOT_FOUND,
        "No active cycle in REVIEWING or CALIBRATING state",
        404
      );
    }

    // Admins see all employees; managers see only direct reports
    const employeeFilter =
      user.role === "ADMIN"
        ? {}
        : { managerId: user.id };

    const assessments = await prisma.selfAssessment.findMany({
      where: {
        cycleId: cycle.id,
        employee: employeeFilter,
      },
      include: {
        employee: true,
        managerReview: true,
        calibration: true,
      },
    });

    const result = assessments.map((assessment) => {
      const selfLevels = assessment.computedLevels
        ? JSON.parse(assessment.computedLevels)
        : null;
      const selfProgress = assessment.careerProgress ?? null;

      const managerLevels = assessment.managerReview?.computedLevels
        ? JSON.parse(assessment.managerReview.computedLevels)
        : null;
      const managerProgress = assessment.managerReview?.careerProgress ?? null;

      const calibrationLevels = assessment.calibration?.finalLevels
        ? JSON.parse(assessment.calibration.finalLevels)
        : undefined;
      const calibrationProgress =
        assessment.calibration?.finalProgress ?? undefined;

      return {
        assessmentId: assessment.id,
        employee: assessment.employee,
        selfLevels,
        selfProgress,
        managerLevels,
        managerProgress,
        calibrationLevels,
        calibrationProgress,
        hasCalibration: assessment.calibration !== null,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
