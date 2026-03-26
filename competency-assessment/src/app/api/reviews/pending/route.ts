import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireRole("MANAGER");

    const cycle = await prisma.assessmentCycle.findFirst({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
    });

    if (!cycle) return NextResponse.json([]);

    const assessments = await prisma.selfAssessment.findMany({
      where: {
        cycleId: cycle.id,
        status: "SUBMITTED",
        employee: { managerId: user.id },
        OR: [
          { managerReview: null },
          { managerReview: { status: "DRAFT" } },
        ],
      },
      include: {
        employee: true,
        managerReview: true,
      },
    });

    return NextResponse.json(assessments);
  } catch (err) {
    return handleApiError(err);
  }
}
