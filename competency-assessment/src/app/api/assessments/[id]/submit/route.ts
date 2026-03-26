import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { computeCompetencyLevel, computeCareerProgress } from "@/lib/scoring-engine";
import { competencies, CompetencyKey } from "@/config/competencies";
import { roles, RoleKey } from "@/config/roles";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const assessment = await prisma.selfAssessment.findUnique({
      where: { id: params.id },
    });

    if (!assessment || assessment.employeeId !== user.id) {
      throw new ApiError(ErrorCodes.FORBIDDEN, "Not your assessment", 403);
    }

    if (assessment.status !== "DRAFT") {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        "Cannot submit an already submitted assessment",
        400
      );
    }

    const scores = JSON.parse(assessment.scores);

    const employee = await prisma.employee.findUnique({ where: { id: user.id } });

    if (!employee) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Employee not found", 404);
    }

    const role = roles[employee.careerTrack as RoleKey];

    if (!role) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Unknown career track: ${employee.careerTrack}`,
        400
      );
    }

    const computedLevels: Record<string, number> = {};
    for (const key of Object.keys(competencies) as CompetencyKey[]) {
      computedLevels[key] = computeCompetencyLevel(scores[key] || {}, key);
    }

    const careerProgress = computeCareerProgress(
      computedLevels as Record<CompetencyKey, number>,
      role.weights
    );

    const updated = await prisma.selfAssessment.update({
      where: { id: params.id },
      data: {
        status: "SUBMITTED",
        computedLevels: JSON.stringify(computedLevels),
        careerProgress,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
