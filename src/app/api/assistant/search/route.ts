import { NextResponse } from "next/server";
import { getChurchModuleAccess, requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

export async function POST(request: Request) {
  const { admin, profile } = await requireChurchModuleAccess("ai_assistant");
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || "").trim().slice(0, 120);
  if (query.length < 2) return NextResponse.json({ error: "Saisissez au moins 2 caractères." }, { status: 400 });
  const churchId = profile.church_id;
  const pattern = `%${query.replace(/[%_]/g, "")} %`.replace(" %", "%");

  const [membersAccess, eventsAccess, departmentsAccess, tasksAccess, financeAccess] = await Promise.all([
    getChurchModuleAccess("members"), getChurchModuleAccess("events"), getChurchModuleAccess("departments"),
    getChurchModuleAccess("administrative_tasks"), getChurchModuleAccess("finance_dashboard"),
  ]);
  const empty = { data: [] as Record<string, unknown>[] };

  const [members, events, departments, tasks, finances] = await Promise.all([
    membersAccess?.granted ? admin.from("members").select("id,first_name,last_name,status,email,phone").eq("church_id", churchId).or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`).limit(12) : empty,
    eventsAccess?.granted ? admin.from("events").select("id,title,event_date,status,location").eq("church_id", churchId).ilike("title", pattern).limit(12) : empty,
    departmentsAccess?.granted ? admin.from("departments").select("id,name,status,description").eq("church_id", churchId).ilike("name", pattern).limit(12) : empty,
    tasksAccess?.granted ? admin.from("admin_tasks").select("id,title,status,due_date,priority").eq("church_id", churchId).ilike("title", pattern).limit(12) : empty,
    financeAccess?.granted ? admin.from("finance_transactions").select("id,title,transaction_type,amount,currency,transaction_date,status").eq("church_id", churchId).ilike("title", pattern).limit(12) : empty,
  ]);
  const groups = [
    { type: "member", label: "Membres", rows: members.data || [], href: "/members" },
    { type: "event", label: "Événements", rows: events.data || [], href: "/events" },
    { type: "department", label: "Départements", rows: departments.data || [], href: "/departments" },
    { type: "task", label: "Tâches", rows: tasks.data || [], href: "/administration/tasks" },
    { type: "finance", label: "Finances", rows: finances.data || [], href: "/finance" },
  ];
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const details = groups.filter((group) => group.rows.length).map((group) => `${group.rows.length} ${group.label.toLowerCase()}`).join(", ");
  return NextResponse.json({ query, total, summary: total ? `J’ai trouvé ${total} résultat(s) dans cette église : ${details}.` : `Aucun résultat trouvé dans cette église pour « ${query} »`, groups });
}
