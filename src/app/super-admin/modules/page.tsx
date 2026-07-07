import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  LayoutGrid,
  Power,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SuperAdminModulesPageProps = {
  searchParams?: Promise<{
    churchId?: string;
    category?: string;
  }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  system: "Général",
  spiritual: "Spirituel",
  administration: "Administration",
  finance: "Finances",
  patrimony: "Patrimoine",
};

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] || category;
}

async function requireSuperAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.status && profile.status !== "active") redirect("/login");
  if (profile.role !== "super_admin") redirect("/dashboard");

  return profile;
}

async function toggleModuleAction(formData: FormData) {
  "use server";

  const profile = await requireSuperAdminProfile();

  const churchId = String(formData.get("churchId") || "").trim();
  const moduleCode = String(formData.get("moduleCode") || "").trim();
  const enabled = String(formData.get("enabled") || "") === "true";

  if (!churchId || !moduleCode) return;

  const admin = createAdminClient();

  const { data: module } = await admin
    .from("app_modules")
    .select("code, is_core")
    .eq("code", moduleCode)
    .maybeSingle();

  if (!module) return;
  if (module.is_core && !enabled) return;

  const { data: church } = await admin
    .from("churches")
    .select("id")
    .eq("id", churchId)
    .maybeSingle();

  if (!church) return;

  await admin.from("church_modules").upsert(
    {
      church_id: churchId,
      module_code: moduleCode,
      enabled,
      enabled_by: profile.id,
      enabled_at: enabled ? new Date().toISOString() : null,
      disabled_at: enabled ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "church_id,module_code",
    }
  );

  revalidatePath("/super-admin/modules");
}

export default async function SuperAdminModulesPage({
  searchParams,
}: SuperAdminModulesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedChurchId = resolvedSearchParams.churchId || "";
  const selectedCategory = resolvedSearchParams.category || "";

  await requireSuperAdminProfile();

  const admin = createAdminClient();

  const [{ data: churches }, { data: modules }, { data: churchModules }] =
    await Promise.all([
      admin
        .from("churches")
        .select("id, name, public_name, slug, status, city, country")
        .order("name", { ascending: true }),

      admin
        .from("app_modules")
        .select(
          "code, name, category, description, sort_order, is_core, default_enabled"
        )
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true }),

      admin
        .from("church_modules")
        .select("church_id, module_code, enabled"),
    ]);

  const allChurches = churches ?? [];
  const allModules = modules ?? [];
  const allChurchModules = churchModules ?? [];

  const enabledByChurchAndModule = new Map<string, boolean>();

  for (const row of allChurchModules as any[]) {
    enabledByChurchAndModule.set(
      `${row.church_id}:${row.module_code}`,
      Boolean(row.enabled)
    );
  }

  const displayedChurches = selectedChurchId
    ? allChurches.filter((church: any) => church.id === selectedChurchId)
    : allChurches;

  const displayedModules = selectedCategory
    ? allModules.filter((module: any) => module.category === selectedCategory)
    : allModules;

  const enabledCount = allChurchModules.filter((row: any) => row.enabled).length;
  const disabledCount = allChurchModules.filter((row: any) => !row.enabled).length;

  const categories = Array.from(
    new Set(allModules.map((module: any) => module.category).filter(Boolean))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Super administration
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Modules par église
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Activez ou désactivez les volets disponibles pour chaque église :
                spirituel, administration, finances et patrimoine.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black">{allChurches.length}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Églises
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Modules activés"
            value={enabledCount}
            description="Toutes églises confondues"
            icon={CheckCircle2}
          />
          <Metric
            label="Modules désactivés"
            value={disabledCount}
            description="Toutes églises confondues"
            icon={XCircle}
          />
          <Metric
            label="Catalogue"
            value={allModules.length}
            description="Modules disponibles"
            icon={LayoutGrid}
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <select
              name="churchId"
              defaultValue={selectedChurchId}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            >
              <option value="">Toutes les églises</option>
              {allChurches.map((church: any) => (
                <option key={church.id} value={church.id}>
                  {church.public_name || church.name}
                </option>
              ))}
            </select>

            <select
              name="category"
              defaultValue={selectedCategory}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            >
              <option value="">Tous les volets</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
              >
                Filtrer
              </button>

              <Link
                href="/super-admin/modules"
                className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]"
              >
                Réinitialiser
              </Link>
            </div>
          </form>
        </section>

        <section className="space-y-5">
          {displayedChurches.map((church: any) => {
            const churchEnabledCount = displayedModules.filter((module: any) =>
              enabledByChurchAndModule.get(`${church.id}:${module.code}`)
            ).length;

            return (
              <div
                key={church.id}
                className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm"
              >
                <div className="border-b border-[#DCEAF5] bg-[#F8FBFD] p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                        <Building2 className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="text-xl font-extrabold text-[#03357A]">
                          {church.public_name || church.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {church.slug} · {church.city || "-"} ·{" "}
                          {church.country || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#03357A] ring-1 ring-[#DCEAF5]">
                      {churchEnabledCount}/{displayedModules.length} actifs
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {displayedModules.map((module: any) => {
                    const isEnabled =
                      enabledByChurchAndModule.get(
                        `${church.id}:${module.code}`
                      ) ?? Boolean(module.default_enabled);

                    return (
                      <div
                        key={`${church.id}-${module.code}`}
                        className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                              {getCategoryLabel(module.category)}
                            </p>

                            <h3 className="mt-2 font-extrabold text-[#03357A]">
                              {module.name}
                            </h3>

                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {module.description || "Module Mpangi-church"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
                              isEnabled
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {isEnabled ? "Actif" : "Inactif"}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-400">
                            {module.is_core
                              ? "Module principal"
                              : "Module optionnel"}
                          </p>

                          <form action={toggleModuleAction}>
                            <input
                              type="hidden"
                              name="churchId"
                              value={church.id}
                            />
                            <input
                              type="hidden"
                              name="moduleCode"
                              value={module.code}
                            />
                            <input
                              type="hidden"
                              name="enabled"
                              value={String(!isEnabled)}
                            />

                            <button
                              type="submit"
                              disabled={Boolean(module.is_core)}
                              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                isEnabled
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              <Power className="h-4 w-4" />
                              {isEnabled ? "Désactiver" : "Activer"}
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: any;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
