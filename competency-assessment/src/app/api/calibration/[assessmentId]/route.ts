import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { z } from "zod";
import { LevelsSchema } from "@/lib/validations";

const CalibrationBodySchema = z.object({
  finalScores: z.record(z.string(), z.unknown()),
  finalLevels: LevelsSchema,
  finalProgress: z.number().min(0).max(5),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const user = await requireRole("MANAGER");

    const assessment = await prisma.selfAssessment.findUnique({
      where: { id: params.assessmentId },
      include: { employee: true },
    });

    if (!assessment) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Assessment not found", 404);
    }

    // Must be the employee's manager or ADMIN
    if (
      user.role !== "ADMIN" &&
      assessment.employee.managerId !== user.id
    ) {
      throw new ApiError(
        ErrorCodes.FORBIDDEN,
        "Not authorized for this assessment",
        403
      );
    }

    const body = await req.json();
    const parsed = CalibrationBodySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid calibration data: ${parsed.error.message}`,
        400
      );
    }

    const { finalScores, finalLevels, finalProgress } = parsed.data;

    // Upsert CalibrationResult
    const calibration = await prisma.calibrationResult.upsert({
      where: { assessmentId: params.assessmentId },
      create: {
        assessmentId: params.assessmentId,
        finalScores: JSON.stringify(finalScores),
        finalLevels: JSON.stringify(finalLevels),
        finalProgress,
        calibratedById: user.id,
      },
      update: {
        finalScores: JSON.stringify(finalScores),
        finalLevels: JSON.stringify(finalLevels),
        finalProgress,
        calibratedById: user.id,
      },
    });

    return NextResponse.json(calibration);
  } catch (err) {
    return handleApiError(err);
  }
}
