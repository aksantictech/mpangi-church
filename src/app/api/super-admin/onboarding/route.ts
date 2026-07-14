import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/access";
import {
  completeOnboarding,
  getChurchOnboarding,
  getOnboardingSummaries,
  initializeOnboarding,
  resetOnboarding,
  updateOnboardingStep,
} from "@/lib/onboarding/onboarding";

import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireSuperAdminAccess();
  await requireSuperAdmin();

  const url = new URL(request.url);
  const churchId = url.searchParams.get("churchId");

  if (churchId) {
    const payload = await getChurchOnboarding(churchId);
    return NextResponse.json(payload);
  }

  const churches = await getOnboardingSummaries();

  return NextResponse.json({
    churches,
  });
}

export async function POST(request: Request) {
  await requireSuperAdminAccess();
  const session = await requireSuperAdmin();
  const body = await request.json();

  const action = String(body.action || "");
  const churchId = String(body.churchId || "");

  if (!action) {
    return NextResponse.json(
      { error: "Action obligatoire." },
      { status: 400 }
    );
  }

  if (action === "init") {
    if (!churchId) {
      return NextResponse.json(
        { error: "churchId obligatoire." },
        { status: 400 }
      );
    }

    await initializeOnboarding(churchId);
    return NextResponse.json(await getChurchOnboarding(churchId));
  }

  if (action === "reset") {
    if (!churchId) {
      return NextResponse.json(
        { error: "churchId obligatoire." },
        { status: 400 }
      );
    }

    await resetOnboarding(churchId);
    return NextResponse.json(await getChurchOnboarding(churchId));
  }

  if (action === "complete_all") {
    if (!churchId) {
      return NextResponse.json(
        { error: "churchId obligatoire." },
        { status: 400 }
      );
    }

    await completeOnboarding(churchId, session.profile?.id ?? null);
    return NextResponse.json(await getChurchOnboarding(churchId));
  }

  if (action === "set_step") {
    const stepId = String(body.stepId || "");
    const status = String(body.status || "pending") as any;
    const notes = typeof body.notes === "string" ? body.notes : "";

    if (!churchId || !stepId) {
      return NextResponse.json(
        { error: "churchId et stepId obligatoires." },
        { status: 400 }
      );
    }

    if (!["pending", "in_progress", "done", "blocked"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide." },
        { status: 400 }
      );
    }

    await updateOnboardingStep({
      stepId,
      status,
      notes,
      completedBy: session.profile?.id ?? null,
    });

    return NextResponse.json(await getChurchOnboarding(churchId));
  }

  return NextResponse.json(
    { error: "Action inconnue." },
    { status: 400 }
  );
}
