import { NextResponse } from "next/server";
import { getChurchModuleAccess, requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type Row = Record<string, unknown>;
type Group = { type: string; label: string; rows: Row[]; href: string };

function safePattern(query: string) {
  return `%${query.replace(/[%_,.()]/g, " ").replace(/\s+/g, "%")}%`;
}

function responseText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();
  return (payload?.output || []).flatMap((item: any) => item?.content || []).filter((item: any) => item?.type === "output_text").map((item: any) => item?.text || "").join("\n").trim();
}

async function optionalAiSummary(question: string, context: object) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_ASSISTANT_MODEL || "gpt-5-mini",
        instructions: "Tu es l’assistant de gestion d’une église. Réponds en français, clairement et factuellement, en 3 courts paragraphes maximum. Utilise uniquement le contexte agrégé fourni. Signale les limites, ne devine jamais et propose une action concrète.",
        input: `Question: ${question}\nContexte interne: ${JSON.stringify(context)}`,
        max_output_tokens: 450,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return responseText(await response.json()) || null;
  } catch { return null; }
}

export async function POST(request: Request) {
  const { admin, profile } = await requireChurchModuleAccess("ai_assistant");
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || "").trim().slice(0, 240);
  if (query.length < 2) return NextResponse.json({ error: "Saisissez au moins 2 caractères." }, { status: 400 });
  const churchId = profile.church_id;
  const pattern = safePattern(query);
  const [membersAccess, eventsAccess, departmentsAccess, tasksAccess, financeAccess, assetsAccess] = await Promise.all([
    getChurchModuleAccess("members"), getChurchModuleAccess("events"), getChurchModuleAccess("departments"),
    getChurchModuleAccess("administrative_tasks"), getChurchModuleAccess("finance_dashboard"), getChurchModuleAccess("assets"),
  ]);
  const empty = { data: [] as Row[], count: 0 };
  const [members, events, departments, tasks, finances, assets, memberTotal, eventTotal, taskOpenTotal, assetTotal] = await Promise.all([
    membersAccess?.granted ? admin.from("members").select("id,first_name,last_name,status").eq("church_id", churchId).or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`).limit(10) : empty,
    eventsAccess?.granted ? admin.from("events").select("id,title,event_date,status,location").eq("church_id", churchId).or(`title.ilike.${pattern},location.ilike.${pattern}`).limit(10) : empty,
    departmentsAccess?.granted ? admin.from("departments").select("id,name,status,description").eq("church_id", churchId).or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(10) : empty,
    tasksAccess?.granted ? admin.from("admin_tasks").select("id,title,status,due_date,priority").eq("church_id", churchId).ilike("title", pattern).limit(10) : empty,
    financeAccess?.granted ? admin.from("finance_transactions").select("id,title,transaction_type,amount,currency,transaction_date,status").eq("church_id", churchId).ilike("title", pattern).limit(10) : empty,
    assetsAccess?.granted ? admin.from("patrimony_assets").select("id,name,asset_code,status,condition,category,location").eq("church_id", churchId).or(`name.ilike.${pattern},asset_code.ilike.${pattern},location.ilike.${pattern}`).limit(10) : empty,
    membersAccess?.granted ? admin.from("members").select("id", { count: "exact", head: true }).eq("church_id", churchId) : empty,
    eventsAccess?.granted ? admin.from("events").select("id", { count: "exact", head: true }).eq("church_id", churchId) : empty,
    tasksAccess?.granted ? admin.from("admin_tasks").select("id", { count: "exact", head: true }).eq("church_id", churchId).neq("status", "completed") : empty,
    assetsAccess?.granted ? admin.from("patrimony_assets").select("id", { count: "exact", head: true }).eq("church_id", churchId).neq("status", "archived") : empty,
  ]);
  const groups: Group[] = [
    { type: "member", label: "Membres", rows: members.data || [], href: "/members" },
    { type: "event", label: "Événements", rows: events.data || [], href: "/events" },
    { type: "department", label: "Départements", rows: departments.data || [], href: "/departments" },
    { type: "task", label: "Tâches", rows: tasks.data || [], href: "/administration/tasks" },
    { type: "finance", label: "Finances", rows: finances.data || [], href: "/finance" },
    { type: "asset", label: "Patrimoine", rows: assets.data || [], href: "/patrimony/assets" },
  ];
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const metrics = { members: memberTotal.count || 0, events: eventTotal.count || 0, openTasks: taskOpenTotal.count || 0, assets: assetTotal.count || 0 };
  const details = groups.filter((group) => group.rows.length).map((group) => `${group.rows.length} ${group.label.toLowerCase()}`).join(", ");
  const localSummary = total ? `J’ai trouvé ${total} correspondance(s) : ${details}. L’église compte actuellement ${metrics.members} membre(s), ${metrics.events} événement(s), ${metrics.openTasks} tâche(s) ouverte(s) et ${metrics.assets} bien(s) actif(s), selon vos autorisations.` : `Aucune correspondance directe pour « ${query} ». Vue générale : ${metrics.members} membre(s), ${metrics.events} événement(s), ${metrics.openTasks} tâche(s) ouverte(s) et ${metrics.assets} bien(s) actif(s). Essayez un nom, une activité, un bien, un lieu ou une période.`;
  const aiContext = { metrics, matches: groups.filter((group) => group.rows.length).map((group) => ({ category: group.label, items: group.rows.slice(0, 5).map((row) => ({ name: row.title || row.name || [row.first_name, row.last_name].filter(Boolean).join(" "), status: row.status, date: row.event_date || row.due_date || row.transaction_date, category: row.category })) })) };
  const aiSummary = await optionalAiSummary(query, aiContext);
  return NextResponse.json({ query, total, summary: aiSummary || localSummary, mode: aiSummary ? "ai" : "local", metrics, groups, suggestions: ["Quelles tâches sont encore ouvertes ?", "Quels biens sont en maintenance ?", "Résume les événements de ce mois", "Combien de membres et de départements avons-nous ?"] });
}
