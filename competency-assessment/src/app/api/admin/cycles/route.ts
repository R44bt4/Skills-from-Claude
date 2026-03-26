import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const cycles = await prisma.assessmentCycle.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cycles);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, "name, startDate, and endDate are required", 400);
    }

    // Guard: no two active cycles
    const activeCycle = await prisma.assessmentCycle.findFirst({
      where: { status: { not: "CLOSED" } },
    });

    if (activeCycle) {
      throw new ApiError(
        ErrorCodes.CYCLE_STATE_ERROR,
        `Cannot create a new cycle while cycle "${activeCycle.name}" is still ${activeCycle.status}. Close it first.`,
        409
      );
    }

    const cycle = await prisma.assessmentCycle.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "OPEN",
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
