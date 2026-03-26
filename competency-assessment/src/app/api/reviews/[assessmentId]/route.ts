import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { ScoresSchema, CommentsSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const user = await requireAuth();

    const assessment = await prisma.selfAssessment.findUnique({
      where: { id: params.assessmentId },
      include: { employee: true, managerReview: true },
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

    let review = assessment.managerReview;

    if (!review) {
      // Pre-fill manager scores from self-assessment scores
      const prefillScores = assessment.scores; // already JSON string
      review = await prisma.managerReview.create({
        data: {
          assessmentId: assessment.id,
          reviewerId: user.id,
          scores: prefillScores,
          comments: JSON.stringify({}),
          status: "DRAFT",
        },
      });
    }

    return NextResponse.json({
      review,
      selfAssessment: assessment,
      employee: assessment.employee,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const user = await requireAuth();

    const review = await prisma.managerReview.findUnique({
      where: { assessmentId: params.assessmentId },
    });

    if (!review) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Review not found", 404);
    }

    if (review.reviewerId !== user.id && user.role !== "ADMIN") {
      throw new ApiError(
        ErrorCodes.FORBIDDEN,
        "Not authorized to update this review",
        403
      );
    }

    if (review.status !== "DRAFT") {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        "Cannot update a submitted review",
        400
      );
    }

    const body = await req.json();

    const parsedScores = ScoresSchema.safeParse(body.scores);
    if (!parsedScores.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid scores: ${parsedScores.error.message}`,
        400
      );
    }

    const parsedComments = CommentsSchema.safeParse(body.comments);
    if (!parsedComments.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid comments: ${parsedComments.error.message}`,
        400
      );
    }

    const updated = await prisma.managerReview.update({
      where: { assessmentId: params.assessmentId },
      data: {
        scores: JSON.stringify(parsedScores.data),
        comments: JSON.stringify(parsedComments.data),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
