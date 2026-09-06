import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { ElementType } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Camera,
  Church,
  CircleAlert,
  Clock3,
  Edit,
  HeartHandshake,
  IdCard,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Smartphone,
  UserCircle,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberProfileDownload from "@/components/members/MemberProfileDownload";
import { getMemberStatusLabel, getMemberTypeLabel } from "@/lib/members/memberLabels";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileDepartmentIds } from "@/lib/security/departmentScope";
import { canAccessAnyModule } from "@/lib/security/routeGuard";

type MemberDetailsPageProps = { params: Promise<{ id: string }> };

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value?: string | null, fallback = "Non renseigné") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function getMemberName(member: Record<string, any>) {
  return [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
}

function getStatusClass(status?: string | null) {
  if (["actif", "active", "integre"].includes(status || "")) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (["nouveau", "en_attente"].includes(status || "")) return "bg-amber-50 text-amber-800 ring-amber-600/20";
  if (["a_suivre", "en_suivi", "irregulier"].includes(status || "")) return "bg-orange-50 text-orange-700 ring-orange-600/20";
  return "bg-slate-100 text-slate-600 ring-slate-500/20";
}

function getProfileCompleteness(member: Record<string, any>) {
  const fields = ["first_name", "last_name", "gender", "birth_date", "phone", "email", "address", "city", "profession", "marital_status", "member_type", "spiritual_status"];
  return Math.round((fields.filter((field) => Boolean(member[field])).length / fields.length) * 100);
}

function getYears(value?: string | null, numericYear?: number | null) {
  const year = numericYear || (value ? new Date(value).getFullYear() : null);
  if (!year || Number.isNaN(year)) return "Non renseignée";
  const years = Math.max(0, new Date().getFullYear() - year);
  return `${year} · ${years} an${years > 1 ? "s" : ""}`;
}

export default async function MemberDetailsPage({ params }: MemberDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id, role, church_id, status").eq("user_id", user.id).maybeSingle();
  if (!profile || !profile.church_id || (profile.status && profile.status !== "active")) redirect("/login");
  if (profile.role === "super_admin") redirect("/super-admin/dashboard");

  const admin = createAdminClient();
  const { data: memberRaw } = await admin.from("members").select("*, churches(id, name, slug)").eq("id", id).eq("church_id", profile.church_id).maybeSingle();
  if (!memberRaw) notFound();
  const member = memberRaw as Record<string, any>;

  const isDepartmentResponsible = ["responsable_d", "department_leader"].includes(String(profile.role || "").toLowerCase());
  if (isDepartmentResponsible) {
    const departmentIds = await getProfileDepartmentIds({ profileId: profile.id, churchId: profile.church_id, email: user.email });
    const { data: assignment } = departmentIds.length
      ? await admin.from("member_departments").select("member_id").eq("church_id", profile.church_id).eq("member_id", id).eq("status", "active").in("department_id", departmentIds).limit(1).maybeSingle()
      : { data: null };
    if (!assignment) notFound();
  }

  const canUpdate = !isDepartmentResponsible && (await canAccessAnyModule(["members"], "update"));
  const attendanceWindowStart = new Date();
  attendanceWindowStart.setDate(attendanceWindowStart.getDate() - 90);
  const ninetyDaysAgo = attendanceWindowStart.toISOString();

  const [departmentResult, trainingResult, attendanceResult, pastoralResult] = await Promise.all([
    admin.from("member_departments").select("department_id, role, status, assigned_at, departments(name)").eq("church_id", profile.church_id).eq("member_id", id).eq("status", "active").order("assigned_at", { ascending: false }),
    admin.from("member_trainings").select("id, training_id, training_program_id, status, completed, started_at, completed_at, notes").eq("church_id", profile.church_id).eq("member_id", id).order("created_at", { ascending: false }),
    admin.from("event_attendances").select("check_in_at, status").eq("church_id", profile.church_id).eq("member_id", id).order("check_in_at", { ascending: false }),
    admin.from("soul_followups").select("status, priority, need_type, last_contact_date, next_contact_date, next_followup_date").eq("church_id", profile.church_id).eq("member_id", id).order("created_at", { ascending: false }),
  ]);

  const departmentAssignments = departmentResult.data || [];
  const trainingAssignments = trainingResult.data || [];
  const trainingIds = [...new Set(trainingAssignments.map((item) => item.training_id).filter(Boolean))];
  const programIds = [...new Set(trainingAssignments.map((item) => item.training_program_id).filter(Boolean))];
  const [{ data: trainings }, { data: trainingPrograms }] = await Promise.all([
    trainingIds.length ? admin.from("trainings").select("id, title").eq("church_id", profile.church_id).in("id", trainingIds) : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    programIds.length ? admin.from("training_programs").select("id, name").eq("church_id", profile.church_id).in("id", programIds) : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const trainingNames = new Map<string, string>();
  for (const training of trainings || []) trainingNames.set(training.id, training.title);
  for (const program of trainingPrograms || []) trainingNames.set(program.id, program.name);
  const trainingRows = trainingAssignments.map((item) => ({
    ...item,
    name: trainingNames.get(item.training_id || item.training_program_id || "") || "Formation",
  }));

  const attendances = attendanceResult.data || [];
  const attendanceCount90Days = attendances.filter((item) => item.check_in_at && item.check_in_at >= ninetyDaysAgo).length;
  const lastAttendance = attendances[0]?.check_in_at || null;
  const pastoralFollowups = pastoralResult.data || [];
  const openPastoralFollowups = pastoralFollowups.filter((item) => !["termine", "completed", "closed"].includes(item.status || "")).length;
  const nextFollowupRaw = pastoralFollowups.map((item) => item.next_followup_date || item.next_contact_date).filter(Boolean).sort()[0] || null;

  const church = firstItem<any>(member.churches);
  const memberName = getMemberName(member) || "Nom non renseigné";
  const departmentNames = departmentAssignments.map((assignment) => firstItem<any>(assignment.departments)?.name).filter(Boolean) as string[];
  const completedTrainingCount = trainingRows.filter((item) => item.completed || ["terminee", "completed"].includes(item.status || "")).length;
  const profileCompleteness = getProfileCompleteness(member);
  const memberCode = member.member_code || `M-${String(member.id).replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const integrationLabel = getYears(member.joined_at || member.joined_date, member.integration_year);

  return (
    <AppShell>
      <div className="space-y-5 pb-24 md:pb-0">
        <Link href="/members" className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-[#15558F]"><ArrowLeft className="h-4 w-4" /> Retour au répertoire</Link>

        <section className="overflow-hidden rounded-[1.75rem] bg-[#082F57] text-white shadow-xl shadow-blue-950/10">
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/20 sm:h-24 sm:w-24">
                  {member.photo_url ? <Image src={member.photo_url} alt={memberName} width={96} height={96} className="h-full w-full object-cover" /> : <UserCircle className="h-11 w-11 text-blue-100" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-blue-100 ring-1 ring-white/15">{memberCode}</span>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-100 ring-1 ring-emerald-300/20">{getMemberStatusLabel(member.status)}</span>
                  </div>
                  <h1 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">{memberName}</h1>
                  <p className="mt-1 text-sm font-semibold text-blue-100">{getMemberTypeLabel(member.member_type)} · {church?.name || "Église"}</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:w-auto">
                <MemberProfileDownload profile={{
                  fullName: memberName,
                  memberCode,
                  churchName: church?.name || "Église",
                  status: getMemberStatusLabel(member.status),
                  memberType: getMemberTypeLabel(member.member_type),
                  phone: member.phone || "Non renseigné",
                  whatsapp: member.whatsapp || "Non renseigné",
                  email: member.email || "Non renseigné",
                  address: [member.address, member.quarter, member.commune, member.city].filter(Boolean).join(", ") || "Non renseignée",
                  birthDate: formatDate(member.birth_date),
                  gender: member.gender || "Non renseigné",
                  maritalStatus: member.marital_status || "Non renseigné",
                  profession: member.profession || "Non renseignée",
                  integration: integrationLabel,
                  spiritualStatus: member.spiritual_status || "Non renseigné",
                  departments: departmentNames,
                  trainings: trainingRows.map((item) => item.name),
                  attendanceCount90Days,
                  lastAttendance: formatDate(lastAttendance, "Aucune présence"),
                  pastoralFollowups: pastoralFollowups.length,
                  nextFollowup: formatDate(nextFollowupRaw),
                  notes: member.notes || "Aucune note enregistrée.",
                  generatedAt: formatDate(new Date().toISOString()),
                }} />
                {canUpdate && <Link href={`/members/${member.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#2F6FA9] px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-[#397DB7]"><Edit className="h-4 w-4" /> Modifier</Link>}
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 bg-white/5 sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric icon={CalendarCheck2} label="Présences sur 90 jours" value={String(attendanceCount90Days)} />
            <HeroMetric icon={Building2} label="Départements actifs" value={String(departmentNames.length)} />
            <HeroMetric icon={BookOpenCheck} label="Formations terminées" value={String(completedTrainingCount)} />
            <HeroMetric icon={BadgeCheck} label="Dossier complété" value={`${profileCompleteness}%`} />
          </div>
        </section>

        <nav className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4" aria-label="Actions du dossier membre">
          {canUpdate && <Link href={`/members/${member.id}/photo`} className="member-action-link"><Camera className="h-4 w-4" /> Photo</Link>}
          {canUpdate && <Link href={`/members/${member.id}/departments`} className="member-action-link"><Building2 className="h-4 w-4" /> Affectations</Link>}
          {canUpdate && <Link href={`/members/${member.id}/trainings`} className="member-action-link"><BookOpenCheck className="h-4 w-4" /> Formations</Link>}
          <Link href={`/members/${member.id}/qr`} className="member-action-link"><QrCode className="h-4 w-4" /> QR & présence</Link>
          <Link href={`/members/${member.id}/card`} className="member-action-link"><IdCard className="h-4 w-4" /> Carte membre</Link>
        </nav>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="space-y-5">
            <SectionCard title="Identité et coordonnées" icon={UserCircle}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoLine icon={Phone} label="Téléphone" value={member.phone || "Non renseigné"} href={member.phone ? `tel:${member.phone}` : undefined} />
                <InfoLine icon={Smartphone} label="WhatsApp" value={member.whatsapp || "Non renseigné"} href={member.whatsapp ? `https://wa.me/${String(member.whatsapp).replace(/\D/g, "")}` : undefined} />
                <InfoLine icon={Mail} label="Email" value={member.email || "Non renseigné"} href={member.email ? `mailto:${member.email}` : undefined} />
                <InfoLine icon={MapPin} label="Adresse" value={[member.address, member.quarter, member.commune, member.city].filter(Boolean).join(", ") || "Non renseignée"} />
              </div>
            </SectionCard>

            <SectionCard title="Situation personnelle et parcours" icon={BriefcaseBusiness}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <CompactInfo label="Date de naissance" value={formatDate(member.birth_date)} />
                <CompactInfo label="Genre" value={member.gender || "Non renseigné"} />
                <CompactInfo label="État civil" value={member.marital_status || "Non renseigné"} />
                <CompactInfo label="Profession" value={member.profession || "Non renseignée"} />
                <CompactInfo label="Intégration" value={integrationLabel} />
                <CompactInfo label="Statut spirituel" value={member.spiritual_status || "Non renseigné"} />
              </div>
            </SectionCard>

            <SectionCard title="Service et développement" icon={UsersRound}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-sm font-black text-slate-900">Affectations</h3>
                  <div className="mt-3 space-y-2">
                    {departmentAssignments.length ? departmentAssignments.map((assignment) => {
                      const department = firstItem<any>(assignment.departments);
                      return <div key={`${assignment.department_id}-${assignment.role}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5"><span className="font-bold text-slate-700">{department?.name || "Département"}</span><span className="text-xs font-black text-[#15558F]">{assignment.role || "membre"}</span></div>;
                    }) : <EmptyText>Aucune affectation active.</EmptyText>}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-sm font-black text-slate-900">Formations</h3>
                  <div className="mt-3 space-y-2">
                    {trainingRows.length ? trainingRows.map((training) => <div key={training.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5"><span className="font-bold text-slate-700">{training.name}</span><span className="text-xs font-black text-emerald-700">{training.completed || ["terminee", "completed"].includes(training.status || "") ? "Terminée" : "En cours"}</span></div>) : <EmptyText>Aucune formation enregistrée.</EmptyText>}
                  </div>
                </div>
              </div>
              {member.training_notes && <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">{member.training_notes}</p>}
            </SectionCard>
          </div>

          <aside className="space-y-5">
            <SectionCard title="Engagement" icon={CalendarCheck2}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <StatusPanel label="Dernière présence" value={formatDate(lastAttendance, "Aucune présence enregistrée")} icon={CalendarDays} />
                <StatusPanel label="Présences récentes" value={`${attendanceCount90Days} sur les 90 derniers jours`} icon={Clock3} />
              </div>
            </SectionCard>

            <SectionCard title="Accompagnement pastoral" icon={HeartHandshake}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <StatusPanel label="Suivis ouverts" value={String(openPastoralFollowups)} icon={CircleAlert} tone={openPastoralFollowups > 0 ? "warning" : "default"} />
                <StatusPanel label="Prochaine échéance" value={formatDate(nextFollowupRaw)} icon={CalendarDays} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">Les détails sensibles restent dans le module de suivi pastoral et suivent ses permissions.</p>
            </SectionCard>

            <SectionCard title="Notes administratives" icon={ShieldCheck}>
              <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{member.notes || "Aucune note administrative enregistrée."}</p>
            </SectionCard>

            <div className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ring-inset ${getStatusClass(member.status)}`}>Statut du dossier : {getMemberStatusLabel(member.status)}</div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function HeroMetric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <div className="flex items-center gap-3 border-b border-white/10 p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Icon className="h-5 w-5 text-blue-200" /></div><div><p className="text-xl font-black">{value}</p><p className="text-xs font-bold text-blue-100">{label}</p></div></div>;
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: ElementType; children: React.ReactNode }) {
  return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#15558F]"><Icon className="h-5 w-5" /></div><h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2></div>{children}</section>;
}

function InfoLine({ icon: Icon, label, value, href }: { icon: ElementType; label: string; value: string; href?: string }) {
  const content = <><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words font-bold text-slate-800">{value}</p></>;
  return <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-slate-50 p-3.5"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6FA9]" /><div className="min-w-0">{href ? <a href={href} className="hover:text-[#15558F]">{content}</a> : content}</div></div>;
}

function CompactInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1.5 break-words font-bold text-slate-800">{value}</p></div>;
}

function StatusPanel({ label, value, icon: Icon, tone = "default" }: { label: string; value: string; icon: ElementType; tone?: "default" | "warning" }) {
  return <div className={`flex items-start gap-3 rounded-2xl p-4 ${tone === "warning" ? "bg-orange-50 text-orange-900" : "bg-slate-50 text-slate-800"}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "warning" ? "text-orange-600" : "text-[#2F6FA9]"}`} /><div><p className="text-xs font-black uppercase tracking-wide opacity-60">{label}</p><p className="mt-1 font-black">{value}</p></div></div>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-400">{children}</p>;
}
