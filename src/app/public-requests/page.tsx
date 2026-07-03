import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Inbox,
  MessageSquare,
  Sparkles,
  UserPlus,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import PublicRequestStatusActions from "@/components/public-requests/PublicRequestStatusActions";
import ConvertPublicRequestToFollowupButton from "@/components/public-requests/ConvertPublicRequestToFollowupButton";
import { createClient } from "@/lib/supabase/server";

type RequestType = "prayer" | "appointment" | "join" | "testimony";

type UnifiedRequest = {
  id: string;
  type: RequestType;
  title: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  message: string;
  meta?: string | null;
  churchId: string;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClass(status?: string | null) {
  if (status === "nouvelle") return "bg-purple-50 text-purple-700";
  if (status === "en_cours") return "bg-blue-50 text-blue-700";
  if (status === "traitee") return "bg-green-50 text-green-700";
  if (status === "archivee") return "bg-slate-100 text-slate-600";

  return "bg-slate-100 text-slate-600";
}

function getTypeIcon(type: RequestType) {
  if (type === "prayer") return HeartHandshake;
  if (type === "appointment") return CalendarDays;
  if (type === "join") return UserPlus;
  if (type === "testimony") return Sparkles;

  return MessageSquare;
}

function getMessage(item: any) {
  return (
    item.request_text ||
    item.message ||
    item.reason ||
    item.testimony ||
    item.notes ||
    "Aucun message détaillé."
  );
}

function getMeta(item: any, type: RequestType) {
  if (type === "appointment") {
    return (
      item.preferred_date ||
      item.appointment_date ||
      item.requested_date ||
      null
    );
  }

  if (type === "join") {
    const needs = [
      item.needs_prayer ? "Besoin de prière" : null,
      item.wants_appointment ? "Souhaite un entretien" : null,
      item.wants_baptism ? "Souhaite le baptême" : null,
    ].filter(Boolean);

    return needs.length > 0 ? needs.join(" • ") : null;
  }

  return null;
}

export default async function PublicRequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id,
      role,
      church_id,
      status,
      churches(id, name, slug)
    `
    )
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

  const church = firstItem<{ id: string; name: string; slug: string }>(
    profile.churches
  );

  const churchId = profile.church_id;

  const [
    { data: prayerRequests },
    { data: appointments },
    { data: joinRequests },
    { data: testimonies },
  ] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("appointments")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("join_requests")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("testimonies")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const allRequests: UnifiedRequest[] = [
    ...(prayerRequests ?? []).map((item: any) => ({
  id: item.id,
  type: "prayer" as const,
  title: "Demande de prière",
  name: item.name,
  phone: item.phone,
  email: item.email,
  status: item.status,
  created_at: item.created_at,
  message: getMessage(item),
  meta: null,
  churchId,
    })),

    ...(appointments ?? []).map((item: any) => ({
      id: item.id,
      type: "appointment" as const,
      title: "Rendez-vous pastoral",
      name: item.name,
      phone: item.phone,
      email: item.email,
      status: item.status,
      created_at: item.created_at,
      message: getMessage(item),
      meta: getMeta(item, "appointment"),
      churchId,
    })),

    ...(joinRequests ?? []).map((item: any) => ({
      id: item.id,
      type: "join" as const,
      title: "Rejoindre l’église",
      name: item.name,
      phone: item.phone,
      email: item.email,
      status: item.status,
      created_at: item.created_at,
      message: getMessage(item),
      meta: getMeta(item, "join"),
      churchId,
    })),

    ...(testimonies ?? []).map((item: any) => ({
      id: item.id,
      type: "testimony" as const,
      title: "Témoignage",
      name: item.name,
      phone: item.phone,
      email: item.email,
      status: item.status,
      created_at: item.created_at,
      message: getMessage(item),
      meta: null,
      churchId,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );

  const newCount = allRequests.filter(
    (request) => request.status === "nouvelle"
  ).length;

  const inProgressCount = allRequests.filter(
    (request) => request.status === "en_cours"
  ).length;

  const doneCount = allRequests.filter(
    (request) => request.status === "traitee"
  ).length;

  const archivedCount = allRequests.filter(
    (request) => request.status === "archivee"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Demandes publiques
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            {church?.name || "Votre église"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
            Retrouvez ici toutes les demandes envoyées depuis la page publique :
            prières, rendez-vous, demandes pour rejoindre l’église et
            témoignages.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Nouvelles"
            value={newCount}
            description="À traiter"
            icon={Inbox}
            accent="purple"
          />

          <MetricCard
            title="En cours"
            value={inProgressCount}
            description="Prises en charge"
            icon={MessageSquare}
            accent="blue"
          />

          <MetricCard
            title="Traitées"
            value={doneCount}
            description="Clôturées"
            icon={CheckCircle2}
            accent="green"
          />

          <MetricCard
            title="Archivées"
            value={archivedCount}
            description="Classées"
            icon={Sparkles}
            accent="blue"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des demandes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les demandes sont automatiquement filtrées par votre église.
              </p>
            </div>

            <div className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-bold text-[#03357A]">
              Total : {allRequests.length}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {allRequests.length === 0 && (
              <div className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-10 text-center">
                <Inbox className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <h3 className="mt-4 text-lg font-extrabold text-[#03357A]">
                  Aucune demande publique
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Les demandes envoyées depuis la page publique apparaîtront ici.
                </p>
              </div>
            )}

            {allRequests.map((request) => {
              const Icon = getTypeIcon(request.type);

              return (
                <article
                  key={`${request.type}-${request.id}`}
                  className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                        <Icon className="h-7 w-7" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold text-[#03357A]">
                            {request.title}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              request.status
                            )}`}
                          >
                            {request.status || "nouvelle"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          Envoyée par{" "}
                          <span className="font-bold text-slate-700">
                            {request.name || "Visiteur"}
                          </span>{" "}
                          — {formatDate(request.created_at)}
                        </p>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p>
                            <span className="font-bold text-[#03357A]">
                              Téléphone :
                            </span>{" "}
                            {request.phone || "Non renseigné"}
                          </p>

                          <p>
                            <span className="font-bold text-[#03357A]">
                              Email :
                            </span>{" "}
                            {request.email || "Non renseigné"}
                          </p>
                        </div>

                        {request.meta && (
                          <p className="mt-2 text-sm font-semibold text-[#2563EB]">
                            {request.meta}
                          </p>
                        )}

                        <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600">
                          {request.message}
                        </p>
                      </div>
                    </div>

                    <div className="xl:min-w-[360px]">
                     <div className="flex flex-wrap gap-2">
  {(request.type === "prayer" ||
    request.type === "appointment" ||
    request.type === "join") && (
    <ConvertPublicRequestToFollowupButton
      requestType={request.type}
      requestId={request.id}
      churchId={request.churchId}
      name={request.name}
      phone={request.phone}
      message={request.message}
      profileId={profile.id}
    />
  )}

  <PublicRequestStatusActions
    requestId={request.id}
    requestType={request.type}
    currentStatus={request.status || "nouvelle"}
  />
</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}