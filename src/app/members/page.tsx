import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarHeart,
  CheckCircle2,
  Plus,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberDirectory, { type MemberDirectoryItem } from "@/components/members/MemberDirectory";
import MemberImportBox from "@/components/members/MemberImportBox";
import MetricCard from "@/components/dashboard/MetricCard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileDepartmentIds } from "@/lib/security/departmentScope";
import { canAccessAnyModule } from "@/lib/security/routeGuard";

type MembersPageProps = { searchParams?: Promise<{ status?: string }> };

function profileCompleteness(member: Record<string, unknown>) {
  const fields = [
    "first_name", "last_name", "gender", "birth_date", "phone", "email",
    "address", "city", "profession", "marital_status", "member_type", "spiritual_status",
  ];
  const completed = fields.filter((field) => Boolean(member[field])).length;
  return Math.round((completed / fields.length) * 100);
}

function hasBirthdayWithinDays(dateValue: string | null, days: number) {
  if (!dateValue) return false;
  const birthDate = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;
  const now = new Date();
  const candidate = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 12);
  if (candidate < now) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate.getTime() - now.getTime() <= days * 24 * 60 * 60 * 1000;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const requestedStatus = (await searchParams)?.status || "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.church_id || (profile.status && profile.status !== "active")) redirect("/login");
  if (profile.role === "super_admin") redirect("/super-admin/dashboard");

  const churchId = profile.church_id;
  const normalizedRole = String(profile.role || "").toLowerCase();
  const isDepartmentResponsible = ["responsable_d", "department_leader"].includes(normalizedRole);
  const canCreate = !isDepartmentResponsible && (await canAccessAnyModule(["members"], "create"));
  const canUpdate = !isDepartmentResponsible && (await canAccessAnyModule(["members"], "update"));
  const canDelete = !isDepartmentResponsible && (await canAccessAnyModule(["members"], "delete"));
  const canApprove = !isDepartmentResponsible && ((await canAccessAnyModule(["members"], "approve")) || canUpdate);
  const canManage = canUpdate || canDelete || canApprove;

  let scopedMemberIds: string[] | null = null;
  const admin = createAdminClient();
  if (isDepartmentResponsible) {
    const departmentIds = await getProfileDepartmentIds({ profileId: profile.id, churchId, email: user.email });
    const { data: assignments } = departmentIds.length
      ? await admin.from("member_departments").select("member_id").eq("church_id", churchId).eq("status", "active").in("department_id", departmentIds)
      : { data: [] as Array<{ member_id: string }> };
    scopedMemberIds = [...new Set((assignments || []).map((item) => item.member_id).filter(Boolean))];
  }

  let membersQuery = admin
    .from("members")
    .select(`
      id, first_name, middle_name, last_name, gender, birth_date,
      phone, whatsapp, email, address, city, commune, quarter,
      profession, marital_status, member_type, spiritual_status,
      status, photo_url, created_at, archived_at
    `)
    .eq("church_id", churchId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (scopedMemberIds) {
    membersQuery = membersQuery.in("id", scopedMemberIds.length ? scopedMemberIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: membersRaw, error: membersError } = await membersQuery;
  const members = (membersRaw || []) as Array<Record<string, any>>;
  const memberIds = members.map((member) => member.id);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: departmentAssignments }, { data: attendances }] = memberIds.length
    ? await Promise.all([
        admin.from("member_departments").select("member_id, department_id, departments(name)").eq("church_id", churchId).eq("status", "active").in("member_id", memberIds),
        admin.from("event_attendances").select("member_id, check_in_at").eq("church_id", churchId).gte("check_in_at", ninetyDaysAgo).in("member_id", memberIds).order("check_in_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const departmentNamesByMember = new Map<string, string[]>();
  for (const assignment of departmentAssignments || []) {
    const department = Array.isArray(assignment.departments) ? assignment.departments[0] : assignment.departments;
    const name = (department as { name?: string } | null)?.name;
    if (!name) continue;
    departmentNamesByMember.set(assignment.member_id, [...(departmentNamesByMember.get(assignment.member_id) || []), name]);
  }

  const attendanceByMember = new Map<string, { count: number; latest: string | null }>();
  for (const attendance of attendances || []) {
    const current = attendanceByMember.get(attendance.member_id) || { count: 0, latest: null };
    attendanceByMember.set(attendance.member_id, { count: current.count + 1, latest: current.latest || attendance.check_in_at });
  }

  const directoryMembers: MemberDirectoryItem[] = members.map((member) => ({
    id: member.id,
    firstName: member.first_name || "",
    middleName: member.middle_name,
    lastName: member.last_name || "",
    phone: member.phone,
    email: member.email,
    photoUrl: member.photo_url,
    memberType: member.member_type,
    status: member.status,
    createdAt: member.created_at,
    archivedAt: member.archived_at,
    departmentNames: departmentNamesByMember.get(member.id) || [],
    lastAttendanceAt: attendanceByMember.get(member.id)?.latest || null,
    attendanceCount90Days: attendanceByMember.get(member.id)?.count || 0,
    profileCompleteness: profileCompleteness(member),
  }));

  const activeCount = members.filter((member) => ["actif", "active", "integre"].includes(member.status)).length;
  const followUpCount = members.filter((member) => ["a_suivre", "en_suivi", "irregulier", "inactif"].includes(member.status)).length;
  const pendingCount = members.filter((member) => member.status === "en_attente").length;
  const birthdaysCount = members.filter((member) => hasBirthdayWithinDays(member.birth_date, 30)).length;

  return (
    <AppShell>
      <div className="space-y-5 pb-24 md:pb-0">
        <section className="overflow-hidden rounded-[1.75rem] bg-[#082F57] p-5 text-white shadow-xl shadow-blue-950/10 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-200"><UsersRound className="h-4 w-4" /> Gestion des personnes</div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Capital humain de l’église</h1>
              <p className="mt-2 text-sm leading-6 text-blue-100 sm:text-base">
                {isDepartmentResponsible
                  ? "Consultez les dossiers et l’engagement des membres affectés à votre département."
                  : "Centralisez les identités, affectations, formations, présences et besoins de suivi de chaque membre."}
              </p>
            </div>
            {canCreate && <Link href="/members/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#082F57] shadow-sm transition hover:bg-blue-50"><Plus className="h-5 w-5" /> Nouveau dossier</Link>}
          </div>
        </section>

        {membersError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Impossible de charger les dossiers : {membersError.message}</div>}

        {pendingCount > 0 && canManage && (
          <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-black">{pendingCount} inscription{pendingCount > 1 ? "s" : ""} à valider</p><p className="mt-0.5 text-sm text-amber-800">Vérifiez les informations avant d’activer la carte membre.</p></div></div>
            <Link href="/members?status=en_attente" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-900 px-4 text-sm font-black text-white">Traiter maintenant</Link>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Dossiers actifs" value={activeCount} description={`${members.length} membres au total`} icon={UserRoundCheck} accent="green" href="/members?status=actif" />
          <MetricCard title="Suivis prioritaires" value={followUpCount} description="À suivre ou irréguliers" icon={AlertTriangle} accent="purple" href="/members?status=a_suivre" />
          <MetricCard title="Anniversaires" value={birthdaysCount} description="Dans les 30 prochains jours" icon={CalendarHeart} accent="purple" href="/members" />
          <MetricCard title="À valider" value={pendingCount} description="Inscriptions publiques" icon={CheckCircle2} accent="blue" href="/members?status=en_attente" />
        </section>

        <MemberDirectory members={directoryMembers} initialStatus={requestedStatus} canUpdate={canUpdate} canDelete={canDelete} canApprove={canApprove} isDepartmentResponsible={isDepartmentResponsible} />

        {canCreate && <MemberImportBox churchId={churchId} profileId={profile.id} />}
      </div>
    </AppShell>
  );
}
