import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { computeCompetencyLevel, computeCareerProgress } from "@/lib/scoring-engine";
import { competencies, CompetencyKey } from "@/config/competencies";
import { roles, RoleKey } from "@/config/roles";

export async function POST(
  _req: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const user = await requireAuth();

    const review = await prisma.managerReview.findUnique({
      where: { assessmentId: params.assessmentId },
      include: {
        assessment: {
          include: { employee: true },
        },
      },
    });

    if (!review) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Review not found", 404);
    }

    if (review.reviewerId !== user.id && user.role !== "ADMIN") {
      throw new ApiError(
        ErrorCodes.FORBIDDEN,
        "Not authorized to submit this review",
        403
      );
    }

    if (review.status !== "DRAFT") {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        "Review already submitted",
        400
      );
    }

    const selfScores = JSON.parse(review.assessment.scores);
    const managerScores = JSON.parse(review.scores);
    const comments = JSON.parse(review.comments);

    // Validate: comments required for any competency where scores differ
    for (const compKey of Object.keys(competencies) as CompetencyKey[]) {
      const selfComp = selfScores[compKey] || {};
      const mgrComp = managerScores[compKey] || {};
      let hasDelta = false;

      outer: for (const levelIdx of Object.keys(selfComp)) {
        for (const skillIdx of Object.keys(selfComp[levelIdx] || {})) {
          const selfVal = selfComp[levelIdx]?.[skillIdx] ?? 0;
          const mgrVal = mgrComp[levelIdx]?.[skillIdx] ?? 0;
          if (Math.abs(selfVal - mgrVal) !== 0) {
            hasDelta = true;
            break outer;
          }
        }
      }

      // Also check skills in manager that are not in self
      if (!hasDelta) {
        outer2: for (const levelIdx of Object.keys(mgrComp)) {
          for (const skillIdx of Object.keys(mgrComp[levelIdx] || {})) {
            const selfVal = selfComp[levelIdx]?.[skillIdx] ?? 0;
            const mgrVal = mgrComp[levelIdx]?.[skillIdx] ?? 0;
            if (Math.abs(selfVal - mgrVal) !== 0) {
              hasDelta = true;
              break outer2;
            }
          }
        }
      }

      if (hasDelta && (!comments[compKey] || comments[compKey].trim() === "")) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Comment required for ${compKey} (scores differ from self-assessment)`,
          400
        );
      }
    }

    // Compute levels + progress from manager scores
    const employee = review.assessment.employee;
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
      computedLevels[key] = computeCompetencyLevel(managerScores[key] || {}, key);
    }

    const careerProgress = computeCareerProgress(
      computedLevels as Record<CompetencyKey, number>,
      role.weights
    );

    const updated = await prisma.managerReview.update({
      where: { assessmentId: params.assessmentId },
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
