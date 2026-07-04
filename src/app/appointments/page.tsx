import { redirect } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  Mail,
  MessageSquareText,
  Phone,
  UserCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import AppointmentStatusActions from "@/components/appointments/AppointmentStatusActions";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getAppointmentName(appointment: any) {
  return (
    appointment.full_name ||
    appointment.name ||
    appointment.visitor_name ||
    appointment.first_name ||
    "Nom non renseigné"
  );
}

function getAppointmentSubject(appointment: any) {
  return (
    appointment.subject ||
    appointment.reason ||
    appointment.message ||
    appointment.description ||
    "Motif non renseigné"
  );
}

function getAppointmentDate(appointment: any) {
  return (
    appointment.preferred_date ||
    appointment.appointment_date ||
    appointment.scheduled_at ||
    appointment.created_at
  );
}

function getStatusLabel(status?: string | null) {
  if (status === "en_cours") return "En cours";
  if (status === "traitee") return "Traitée";
  if (status === "archivee") return "Archivée";
  return "Nouvelle";
}

function getStatusClass(status?: string | null) {
  if (status === "en_cours") return "bg-orange-50 text-orange-700";
  if (status === "traitee") return "bg-green-50 text-green-700";
  if (status === "archivee") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-700";
}

export default async function AppointmentsPage() {
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

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false });

  const items = appointments ?? [];

  const newCount = items.filter(
    (item: any) => !item.status || item.status === "nouvelle"
  ).length;

  const inProgressCount = items.filter(
    (item: any) => item.status === "en_cours"
  ).length;

  const doneCount = items.filter(
    (item: any) => item.status === "traitee"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <CalendarClock className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Rendez-vous
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Demandes de rendez-vous
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Consultez et traitez les demandes reçues depuis la page publique
                de l’église.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total"
            value={items.length}
            description="Demandes reçues"
          />

          <StatCard
            title="Nouvelles"
            value={newCount}
            description="À traiter"
          />

          <StatCard
            title="En cours"
            value={inProgressCount}
            description="Suivi en cours"
          />

          <StatCard
            title="Traitées"
            value={doneCount}
            description="Demandes clôturées"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Liste des demandes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Les demandes envoyées depuis le formulaire public de rendez-vous
              apparaissent ici.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error.message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <div className="rounded-3xl bg-[#F8FBFD] p-8 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <p className="mt-4 font-extrabold text-[#03357A]">
                  Aucune demande de rendez-vous.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Les visiteurs peuvent demander un rendez-vous depuis la page
                  publique de l’église.
                </p>
              </div>
            ) : (
              items.map((appointment: any) => (
                <article
                  key={appointment.id}
                  className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#03357A] shadow-sm">
                        <UserCircle className="h-6 w-6" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold text-[#03357A]">
                            {getAppointmentName(appointment)}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                              appointment.status
                            )}`}
                          >
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Date demandée :{" "}
                          {formatDate(getAppointmentDate(appointment))}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Reçu le : {formatDate(appointment.created_at)}
                        </p>
                      </div>
                    </div>

                    <AppointmentStatusActions
                      appointmentId={appointment.id}
                      currentStatus={appointment.status}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {appointment.phone && (
                      <InfoLine
                        icon={Phone}
                        label="Téléphone"
                        value={appointment.phone}
                      />
                    )}

                    {appointment.email && (
                      <InfoLine
                        icon={Mail}
                        label="Email"
                        value={appointment.email}
                      />
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#03357A]">
                      <MessageSquareText className="h-4 w-4" />
                      Motif de la demande
                    </div>

                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {getAppointmentSubject(appointment)}
                    </p>
                  </div>

                  {appointment.admin_notes && (
                    <div className="mt-4 rounded-2xl bg-[#EAF3FA] p-4">
                      <p className="text-sm font-bold text-[#03357A]">
                        Notes internes
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {appointment.admin_notes}
                      </p>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#03357A]">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}