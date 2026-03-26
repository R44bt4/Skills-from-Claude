import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();

    const cycle = await prisma.assessmentCycle.findFirst({
      where: { status: "OPEN" },
    });

    if (!cycle) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "No active assessment cycle", 404);
    }

    const assessment = await prisma.selfAssessment.findUnique({
      where: {
        employeeId_cycleId: {
          employeeId: user.id,
          cycleId: cycle.id,
        },
      },
    });

    return NextResponse.json({ cycle, assessment: assessment ?? null });
  } catch (err) {
    return handleApiError(err);
  }
}
