import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();

    // Find the latest growth plan for the current user (highest version, most recent cycle)
    const growthPlan = await prisma.growthPlan.findFirst({
      where: { employeeId: user.id },
      orderBy: [{ generatedAt: "desc" }, { version: "desc" }],
      include: {
        cycle: true,
        calibration: true,
      },
    });

    if (!growthPlan) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "No growth plan available", 404);
    }

    return NextResponse.json(growthPlan);
  } catch (err) {
    return handleApiError(err);
  }
}
