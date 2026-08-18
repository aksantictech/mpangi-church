import Link from "next/link";
import {
  CalendarDays,
  Eye,
  Filter,
  HeartHandshake,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    service?: string;
    type?: string;
    created?: string;
  }>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function fullName(item: any) {
  return [item.first_name, item.middle_name, item.last_name]
    .filter(Boolean)
    .join(" ");
}

function typeLabel(item: any) {
  if (item.is_newcomer && item.is_new_convert) {
    return "Nouveau venu + converti";
  }
  if (item.is_new_convert) return "Nouveau converti";
  return "Nouveau venu";
}

export default async function SoulIntakePage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const from = params.from || monthStart();
  const to = params.to || today();
  const service = ["dimanche", "semaine"].includes(params.service || "")
    ? params.service || ""
    : "";
  const type = ["newcomer", "convert"].includes(params.type || "")
    ? params.type || ""
    : "";

  const { admin, profile } = await requireChurchModuleAccess("souls");

  let query = admin
    .from("soul_intakes")
    .select(`
      id,
      first_name,
      middle_name,
      last_name,
      reception_date,
      service_type,
      whatsapp_phone,
      city,
      is_newcomer,
      is_new_convert,
      linked_followup_id,
      assigned_profile:profiles!soul_intakes_assigned_profile_id_fkey(full_name)
    `)
    .eq("church_id", profile.church_id)
    .gte("reception_date", from)
    .lte("reception_date", to)
    .order("reception_date", { ascending: false })
    .limit(500);

  if (service) query = query.eq("service_type", service);
  if (type === "newcomer") query = query.eq("is_newcomer", true);
  if (type === "convert") query = query.eq("is_new_convert", true);

  const { data, error } = await query;
  const rows = data ?? [];

  const newcomers = rows.filter((item: any) => item.is_newcomer).length;
  const converts = rows.filter((item: any) => item.is_new_convert).length;
  const sunday = rows.filter((item: any) => item.service_type === "dimanche").length;
  const week = rows.filter((item: any) => item.service_type === "semaine").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <HeartHandshake className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                  Volet spirituel
                </p>
                <h1 className="mt-2 text-3xl font-black">Accueil des âmes</h1>
                <p className="mt-2 max-w-3xl text-sm text-blue-50">
                  Retrouvez les personnes reçues, filtrez par période, culte et type,
                  puis ouvrez leur suivi pastoral.
                </p>
              </div>
            </div>

            <Link
              href="/souls/intake/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#03357A] shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nouvelle âme
            </Link>
          </div>
        </section>

        {params.created === "1" && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            L’accueil et le suivi ont été enregistrés.
          </div>
        )}

        <form className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_1fr_210px_220px_auto]">
          <label className="text-sm font-black text-[#03357A]">
            Du
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-2 h-12 w-full rounded-2xl border border-[#DCEAF5] px-4"
            />
          </label>

          <label className="text-sm font-black text-[#03357A]">
            Au
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-2 h-12 w-full rounded-2xl border border-[#DCEAF5] px-4"
            />
          </label>

          <label className="text-sm font-black text-[#03357A]">
            Culte
            <select
              name="service"
              defaultValue={service}
              className="mt-2 h-12 w-full rounded-2xl border border-[#DCEAF5] px-4"
            >
              <option value="">Tous les cultes</option>
              <option value="dimanche">Dimanche</option>
              <option value="semaine">Semaine</option>
            </select>
          </label>

          <label className="text-sm font-black text-[#03357A]">
            Type
            <select
              name="type"
              defaultValue={type}
              className="mt-2 h-12 w-full rounded-2xl border border-[#DCEAF5] px-4"
            >
              <option value="">Tous les types</option>
              <option value="newcomer">Nouveau venu</option>
              <option value="convert">Nouveau converti</option>
            </select>
          </label>

          <div className="flex items-end">
            <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white">
              <Filter className="h-4 w-4" />
              Filtrer
            </button>
          </div>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Âmes reçues" value={rows.length} />
          <Metric label="Nouveaux venus" value={newcomers} />
          <Metric label="Nouveaux convertis" value={converts} />
          <Metric label="Dimanche / semaine" value={`${sunday} / ${week}`} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-black text-[#03357A]">
              Liste des âmes reçues
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} personne(s) sur la période sélectionnée.
            </p>
          </div>

          {error ? (
            <div className="p-8 text-sm font-bold text-red-700">
              Impossible de charger la liste : {error.message}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <HeartHandshake className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-black text-[#03357A]">
                Aucune âme reçue pour ces filtres.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-left text-sm">
                <thead className="bg-[#F8FBFD] text-[#03357A]">
                  <tr>
                    <th className="px-5 py-3">Personne</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Culte</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Téléphone</th>
                    <th className="px-5 py-3">Suivi attribué à</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF4F8]">
                  {rows.map((item: any) => {
                    const assignee = Array.isArray(item.assigned_profile)
                      ? item.assigned_profile[0]
                      : item.assigned_profile;

                    return (
                      <tr key={item.id} className="hover:bg-[#F8FBFD]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                              <UserRound className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="font-black text-[#03357A]">
                                {fullName(item)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.city || "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#3F79B3]" />
                            {formatDate(item.reception_date)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {item.service_type === "dimanche" ? "Dimanche" : "Semaine"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                            {typeLabel(item)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            {item.whatsapp_phone || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {assignee?.full_name || "Non renseigné"}
                        </td>
                        <td className="px-5 py-4">
                          {item.linked_followup_id ? (
                            <Link
                              href={`/souls/${item.linked_followup_id}`}
                              className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-xs font-black text-[#03357A]"
                            >
                              <Eye className="h-4 w-4" />
                              Voir le suivi
                            </Link>
                          ) : (
                            <span className="text-xs font-bold text-amber-700">
                              Suivi non lié
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
    </article>
  );
}
