import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN");

    const cycle = await prisma.assessmentCycle.findUnique({
      where: { id: params.id },
    });

    if (!cycle) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Cycle not found", 404);
    }

    if (cycle.status === "OPEN") {
      // Guard: at least 1 SUBMITTED assessment
      const submittedCount = await prisma.selfAssessment.count({
        where: { cycleId: cycle.id, status: "SUBMITTED" },
      });

      if (submittedCount === 0) {
        throw new ApiError(
          ErrorCodes.CYCLE_STATE_ERROR,
          "Cannot advance to REVIEWING: no submitted assessments yet",
          400
        );
      }

      await prisma.assessmentCycle.update({
        where: { id: cycle.id },
        data: { status: "REVIEWING" },
      });

      return NextResponse.json({ status: "REVIEWING" });
    }

    if (cycle.status === "REVIEWING") {
      // Guard: all SUBMITTED assessments have a SUBMITTED ManagerReview
      const submittedAssessments = await prisma.selfAssessment.findMany({
        where: { cycleId: cycle.id, status: "SUBMITTED" },
        include: { managerReview: true },
      });

      const missingReviews = submittedAssessments.filter(
        (a) => !a.managerReview || a.managerReview.status !== "SUBMITTED"
      );

      if (missingReviews.length > 0) {
        throw new ApiError(
          ErrorCodes.CYCLE_STATE_ERROR,
          `Cannot advance to CALIBRATING: ${missingReviews.length} assessment(s) are missing a submitted manager review`,
          400
        );
      }

      await prisma.assessmentCycle.update({
        where: { id: cycle.id },
        data: { status: "CALIBRATING" },
      });

      return NextResponse.json({ status: "CALIBRATING" });
    }

    if (cycle.status === "CALIBRATING") {
      throw new ApiError(
        ErrorCodes.CYCLE_STATE_ERROR,
        "To close a CALIBRATING cycle, use POST /api/calibration/lock which validates all calibrations are complete",
        400
      );
    }

    if (cycle.status === "CLOSED") {
      throw new ApiError(
        ErrorCodes.CYCLE_STATE_ERROR,
        "Cycle is already CLOSED. No further transitions are possible.",
        400
      );
    }

    throw new ApiError(ErrorCodes.CYCLE_STATE_ERROR, "Unknown cycle status", 400);
  } catch (err) {
    return handleApiError(err);
  }
}
