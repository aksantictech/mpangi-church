import Link from "next/link";
import {
  ArrowRight,
  CheckSquare2,
  Church,
  ClipboardCheck,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getRoleDashboardData } from "@/lib/dashboard/roleDashboard";

export default async function RoleDashboardPage() {
  const data = await getRoleDashboardData();

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/15 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Dashboard personnalisé
              </p>

              <h1 className="mt-2 break-words text-3xl font-black sm:text-5xl">
                Bonjour {data.context.fullName}
              </h1>

              <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-blue-50">
                Rôle : <strong>{data.roleLabel}</strong>
                {data.context.churchName
                  ? ` · ${data.context.churchName}`
                  : ""}
              </p>
            </div>

            <Link
              href="/my-work"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A]"
            >
              <ClipboardCheck className="h-5 w-5" />
              Mon travail
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Users}
            label="Membres"
            value={data.metrics.members}
          />
          <Metric
            icon={CheckSquare2}
            label="Tâches ouvertes"
            value={data.metrics.openTasks}
          />
          <Metric
            icon={HeartHandshake}
            label="Dons à vérifier"
            value={data.metrics.pendingDonations}
          />
          <Metric
            icon={Church}
            label="Suivis des âmes"
            value={data.metrics.soulFollowups}
          />
        </section>

        <section className="mt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3F79B3]">
                Accès utiles
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#03357A]">
                Modules de votre rôle
              </h2>
            </div>

            {["super_admin", "church_admin", "admin_eglise", "pasteur_t", "pastor"].includes(
              data.context.role
            ) && (
              <Link
                href="/settings/roles"
                className="hidden min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5] sm:inline-flex"
              >
                <ShieldCheck className="h-4 w-4" />
                Configurer les accès
              </Link>
            )}
          </div>

          {data.widgets.length === 0 ? (
            <div className="mt-4 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-8 text-center text-sm font-bold text-slate-500">
              Aucun widget n’est activé pour ce rôle.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.widgets.map((widget) => (
                <Link
                  key={widget.code}
                  href={widget.href}
                  className="group rounded-[1.5rem] border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-black text-[#03357A]">
                        {widget.title}
                      </h3>

                      <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                        {widget.description}
                      </p>
                    </div>

                    <ArrowRight className="h-5 w-5 shrink-0 text-[#3F79B3] transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | null | undefined;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm">
      <Icon className="h-6 w-6 text-[#03357A]" />
      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value === null || value === undefined ? "—" : value}
      </p>
    </article>
  );
}
