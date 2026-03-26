import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/errors";
import { generateGrowthPlan } from "@/lib/growth-plan-ai";

interface RouteContext {
  params: { calibrationId: string };
}

export async function POST(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { calibrationId } = params;

    // Only ADMINs can regenerate growth plans
    await requireRole("ADMIN");

    const plan = await generateGrowthPlan(calibrationId);

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
