import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import DepartmentForm from "@/components/departments/DepartmentForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewDepartmentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/departments"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux départements
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <Building2 className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Nouveau département
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Créer un département
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Ce département sera automatiquement rattaché à votre église.
              </p>
            </div>
          </div>
        </section>

        <DepartmentForm mode="create" churchId={profile.church_id} />
      </div>
    </AppShell>
  );
}