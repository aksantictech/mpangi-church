import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingStatus = "pending" | "in_progress" | "done" | "blocked";

export type ChurchOnboardingStep = {
  id: string;
  church_id: string;
  step_key: string;
  label: string;
  description: string | null;
  status: OnboardingStatus;
  sort_order: number;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
};

export type ChurchOnboardingSummary = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  city: string | null;
  country: string | null;
  totalSteps: number;
  doneSteps: number;
  blockedSteps: number;
  progress: number;
};

function calculateProgress(total: number, done: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export async function initializeOnboarding(churchId: string) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("initialize_church_onboarding", {
    p_church_id: churchId,
  });

  if (error) throw new Error(error.message);
}

export async function getOnboardingSummaries(): Promise<ChurchOnboardingSummary[]> {
  const admin = createAdminClient();

  const { data: churches, error: churchesError } = await admin
    .from("churches")
    .select("id, name, slug, status, city, country")
    .order("name", { ascending: true });

  if (churchesError) throw new Error(churchesError.message);

  for (const church of churches ?? []) {
    await initializeOnboarding(church.id);
  }

  const { data: steps, error: stepsError } = await admin
    .from("church_onboarding_steps")
    .select("church_id, status");

  if (stepsError) throw new Error(stepsError.message);

  return (churches ?? []).map((church: any) => {
    const churchSteps = (steps ?? []).filter(
      (step: any) => step.church_id === church.id
    );

    const totalSteps = churchSteps.length;
    const doneSteps = churchSteps.filter((step: any) => step.status === "done").length;
    const blockedSteps = churchSteps.filter(
      (step: any) => step.status === "blocked"
    ).length;

    return {
      id: church.id,
      name: church.name,
      slug: church.slug,
      status: church.status,
      city: church.city,
      country: church.country,
      totalSteps,
      doneSteps,
      blockedSteps,
      progress: calculateProgress(totalSteps, doneSteps),
    };
  });
}

export async function getChurchOnboarding(churchId: string) {
  const admin = createAdminClient();

  await initializeOnboarding(churchId);

  const [{ data: church, error: churchError }, { data: steps, error: stepsError }] =
    await Promise.all([
      admin
        .from("churches")
        .select("id, name, slug, status, city, country, logo_url")
        .eq("id", churchId)
        .maybeSingle(),

      admin
        .from("church_onboarding_steps")
        .select("*")
        .eq("church_id", churchId)
        .order("sort_order", { ascending: true }),
    ]);

  if (churchError) throw new Error(churchError.message);
  if (stepsError) throw new Error(stepsError.message);
  if (!church) throw new Error("Église introuvable.");

  const totalSteps = (steps ?? []).length;
  const doneSteps = (steps ?? []).filter((step: any) => step.status === "done").length;
  const blockedSteps = (steps ?? []).filter(
    (step: any) => step.status === "blocked"
  ).length;

  return {
    church,
    steps: (steps ?? []) as ChurchOnboardingStep[],
    totalSteps,
    doneSteps,
    blockedSteps,
    progress: calculateProgress(totalSteps, doneSteps),
  };
}

export async function updateOnboardingStep({
  stepId,
  status,
  notes,
  completedBy,
}: {
  stepId: string;
  status: OnboardingStatus;
  notes?: string;
  completedBy?: string | null;
}) {
  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    status,
    notes: notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (status === "done") {
    payload.completed_at = new Date().toISOString();
    if (completedBy) payload.completed_by = completedBy;
  } else {
    payload.completed_at = null;
    payload.completed_by = null;
  }

  const { error } = await admin
    .from("church_onboarding_steps")
    .update(payload)
    .eq("id", stepId);

  if (error) throw new Error(error.message);
}

export async function completeOnboarding(churchId: string, completedBy?: string | null) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("complete_church_onboarding", {
    p_church_id: churchId,
    p_completed_by: completedBy ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function resetOnboarding(churchId: string) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("reset_church_onboarding", {
    p_church_id: churchId,
  });

  if (error) throw new Error(error.message);
}
