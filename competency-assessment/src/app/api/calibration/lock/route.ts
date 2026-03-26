import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function POST() {
  try {
    await requireRole("ADMIN");

    // Find cycle in CALIBRATING state
    const cycle = await prisma.assessmentCycle.findFirst({
      where: { status: "CALIBRATING" },
    });

    if (!cycle) {
      throw new ApiError(
        ErrorCodes.CYCLE_STATE_ERROR,
        "No cycle is currently in CALIBRATING state",
        400
      );
    }

    // Get all assessments in the cycle
    const assessments = await prisma.selfAssessment.findMany({
      where: { cycleId: cycle.id },
      include: { calibration: true, employee: true },
    });

    // Check that ALL assessments have a CalibrationResult
    const uncalibrated = assessments.filter((a) => !a.calibration);
    if (uncalibrated.length > 0) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `${uncalibrated.length} assessment(s) are missing calibration results`,
        400
      );
    }

    // Advance cycle to CLOSED
    await prisma.assessmentCycle.update({
      where: { id: cycle.id },
      data: { status: "CLOSED" },
    });

    // Create GrowthPlan records for each CalibrationResult
    const calibrations = assessments
      .map((a) => a.calibration)
      .filter((c): c is NonNullable<typeof c> => c !== null);

    await prisma.growthPlan.createMany({
      data: calibrations.map((calibration) => {
        const assessment = assessments.find(
          (a) => a.calibration?.id === calibration.id
        )!;
        return {
          calibrationId: calibration.id,
          employeeId: assessment.employeeId,
          cycleId: cycle.id,
          content: "",
          rawLlmResponse: "",
          status: "GENERATING",
        };
      }),
    });

    return NextResponse.json({
      locked: true,
      plansQueued: calibrations.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
