import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { ScoresSchema } from "@/lib/validations";

export async function PUT(
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
        "Cannot update submitted assessment",
        400
      );
    }

    const body = await req.json();
    const parsed = ScoresSchema.safeParse(body.scores);

    if (!parsed.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid scores: ${parsed.error.message}`,
        400
      );
    }

    const updated = await prisma.selfAssessment.update({
      where: { id: params.id },
      data: {
        scores: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
