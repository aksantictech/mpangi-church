import Link from "next/link";
import { Settings2 } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminModulesPage() {
  await requireSuperAdmin();

  const admin = createAdminClient();

  const { data: churches } = await admin
    .from("churches")
    .select("id, name, slug, status, city, country")
    .order("name", { ascending: true });

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Super admin
          </p>
          <h1 className="mt-3 text-3xl font-black">
            Modules par église
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Choisissez une église, synchronisez ses modules et activez tout en un clic.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(churches ?? []).map((church: any) => (
            <article
              key={church.id}
              className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Settings2 className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-lg font-black text-[#03357A]">
                    {church.name}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    /{church.slug}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {church.city || "-"} {church.country ? `• ${church.country}` : ""}
                  </p>
                </div>
              </div>

              <Link
                href={`/super-admin/churches/${church.id}/modules`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
              >
                Gérer les modules
              </Link>
            </article>
          ))}
        </section>
      </div>
    </SuperAdminShell>
  );
}
