import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManagerOf } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

interface RouteContext {
  params: { employeeId: string };
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { employeeId } = params;

    // Requires MANAGER of this employee or ADMIN
    await requireManagerOf(employeeId);

    const growthPlan = await prisma.growthPlan.findFirst({
      where: { employeeId },
      orderBy: [{ generatedAt: "desc" }, { version: "desc" }],
      include: {
        cycle: true,
        calibration: true,
        employee: {
          select: { id: true, name: true, email: true, careerTrack: true },
        },
      },
    });

    if (!growthPlan) {
      throw new ApiError(
        ErrorCodes.NOT_FOUND,
        "No growth plan available for this employee",
        404
      );
    }

    return NextResponse.json(growthPlan);
  } catch (err) {
    return handleApiError(err);
  }
}
