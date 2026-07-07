import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Lock,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ModulePlaceholderPageProps = {
  moduleCode: string;
  title: string;
  categoryLabel: string;
  description: string;
  features: string[];
  nextSteps: string[];
};

async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.status && profile.status !== "active") redirect("/login");
  if (profile.role === "super_admin") redirect("/super-admin/dashboard");
  if (!profile.church_id) redirect("/login");

  return profile;
}

export default async function ModulePlaceholderPage({
  moduleCode,
  title,
  categoryLabel,
  description,
  features,
  nextSteps,
}: ModulePlaceholderPageProps) {
  const profile = await getCurrentProfile();
  const admin = createAdminClient();

  const [{ data: appModule }, { data: churchModule }, { data: permission }] =
    await Promise.all([
      admin
        .from("app_modules")
        .select("code, name, category, description")
        .eq("code", moduleCode)
        .maybeSingle(),

      admin
        .from("church_modules")
        .select("module_code, enabled")
        .eq("church_id", profile.church_id)
        .eq("module_code", moduleCode)
        .maybeSingle(),

      admin
        .from("church_role_module_permissions")
        .select("can_view, can_create, can_update, can_approve, can_export")
        .eq("church_id", profile.church_id)
        .eq("module_code", moduleCode)
        .eq("role", profile.role)
        .maybeSingle(),
    ]);

  const moduleExists = Boolean(appModule);
  const moduleEnabled = Boolean(churchModule?.enabled);
  const canView = Boolean(permission?.can_view);

  if (!moduleExists || !moduleEnabled || !canView) {
    return (
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-orange-900 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-700">
                <Lock className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
                  Accès module
                </p>

                <h1 className="mt-2 text-2xl font-black">
                  Module non disponible
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-7">
                  Ce module n’est pas activé pour votre église ou votre rôle ne
                  dispose pas encore des droits nécessaires. Le super admin peut
                  l’activer depuis la page Modules par église.
                </p>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                {categoryLabel}
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">{title}</h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                {description}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black">Phase</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                préparation
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Module activé"
            description="Ce module est actif pour cette église."
            icon={CheckCircle2}
          />
          <StatusCard
            title="Accès autorisé"
            description="Votre rôle peut consulter cette page."
            icon={Lock}
          />
          <StatusCard
            title="En construction"
            description="Les écrans métier seront ajoutés progressivement."
            icon={Clock3}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <ArrowRight className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">
                  Fonctionnalités prévues
                </h2>
                <p className="text-sm text-slate-500">
                  Ce que ce module va gérer dans Mpangi-church.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                >
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {feature}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#8B5CF6]">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">
                  Prochaines étapes
                </h2>
                <p className="text-sm text-slate-500">
                  Ordre recommandé de développement.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {nextSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-3 rounded-2xl bg-[#F8FBFD] p-4"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#03357A] text-xs font-black text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: any;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <p className="font-extrabold text-[#03357A]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
