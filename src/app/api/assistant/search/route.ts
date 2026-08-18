import { NextResponse } from "next/server";
import {
  getChurchModuleAccess,
  requireChurchModuleAccess,
} from "@/lib/modules/moduleAccess";

export const dynamic = "force-dynamic";

type Chart = {
  type: "bar" | "line" | "pie";
  title: string;
  labels: string[];
  values: number[];
};

type AssistantAnswer = {
  answer: string;
  highlights: string[];
  chart: Chart | null;
  sources: Array<{ label: string; href: string }>;
  suggestions: string[];
};

function safePattern(query: string) {
  return `%${query.replace(/[%_,.()]/g, " ").replace(/\s+/g, "%")}%`;
}

function rate(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(
    new Date(year, month - 1, 1)
  );
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function readResponseText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();
  return (payload?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((item: any) => item?.type === "output_text")
    .map((item: any) => item?.text || "")
    .join("\n")
    .trim();
}

async function aiAnswer(question: string, context: object): Promise<AssistantAnswer | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_ASSISTANT_MODEL || "gpt-5.6",
        instructions: [
          "Tu es l'assistant analytique sécurisé de Mpangi Church.",
          "Réponds en français comme un analyste BI expérimenté.",
          "Utilise EXCLUSIVEMENT le contexte JSON fourni : ne fabrique aucune donnée.",
          "Donne d'abord la réponse, puis 2 à 5 constats utiles.",
          "Si une comparaison temporelle ou une répartition est pertinente, produis un graphique.",
          "Ne propose jamais de SQL, de contournement d'accès ou de données hors de l'église courante.",
          "Si le contexte ne permet pas de répondre, dis précisément quelle donnée manque.",
        ].join(" "),
        input: `QUESTION UTILISATEUR:\n${question}\n\nCONTEXTE AUTORISÉ DE L'ÉGLISE:\n${JSON.stringify(context)}`,
        max_output_tokens: 1100,
        text: {
          format: {
            type: "json_schema",
            name: "mpangi_church_answer",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                answer: { type: "string" },
                highlights: { type: "array", items: { type: "string" }, maxItems: 5 },
                chart: {
                  anyOf: [
                    { type: "null" },
                    {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        type: { type: "string", enum: ["bar", "line", "pie"] },
                        title: { type: "string" },
                        labels: { type: "array", items: { type: "string" } },
                        values: { type: "array", items: { type: "number" } },
                      },
                      required: ["type", "title", "labels", "values"],
                    },
                  ],
                },
                sources: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      label: { type: "string" },
                      href: { type: "string" },
                    },
                    required: ["label", "href"],
                  },
                  maxItems: 6,
                },
                suggestions: { type: "array", items: { type: "string" }, maxItems: 5 },
              },
              required: ["answer", "highlights", "chart", "sources", "suggestions"],
            },
          },
        },
      }),
      signal: AbortSignal.timeout(22_000),
    });

    if (!response.ok) {
      console.error("OpenAI assistant error", response.status, await response.text());
      return null;
    }

    const text = readResponseText(await response.json());
    if (!text) return null;
    const parsed = JSON.parse(text) as AssistantAnswer;
    if (parsed.chart && parsed.chart.labels.length !== parsed.chart.values.length) {
      parsed.chart = null;
    }
    return parsed;
  } catch (error) {
    console.error("OpenAI assistant unavailable", error);
    return null;
  }
}

export async function POST(request: Request) {
  const { admin, profile } = await requireChurchModuleAccess("ai_assistant");
  const body = await request.json().catch(() => ({}));
  const question = String(body.query || "").trim().slice(0, 500);
  if (question.length < 2) {
    return NextResponse.json({ error: "Saisissez une question plus précise." }, { status: 400 });
  }

  const churchId = profile.church_id;
  const pattern = safePattern(question);
  const months = lastSixMonths();
  const firstMonthDate = `${months[0]}-01`;

  const [
    membersAccess,
    departmentsAccess,
    attendanceAccess,
    soulsAccess,
    tasksAccess,
    correspondenceAccess,
    financeAccess,
    assetsAccess,
    extensionsAccess,
  ] = await Promise.all([
    getChurchModuleAccess("members"),
    getChurchModuleAccess("departments"),
    getChurchModuleAccess("attendance"),
    getChurchModuleAccess("souls"),
    getChurchModuleAccess("administrative_tasks"),
    getChurchModuleAccess("correspondence"),
    getChurchModuleAccess("finance_dashboard"),
    getChurchModuleAccess("assets"),
    getChurchModuleAccess("extension_activities"),
  ]);

  const modules = {
    members: Boolean(membersAccess?.granted),
    departments: Boolean(departmentsAccess?.granted),
    attendance: Boolean(attendanceAccess?.granted),
    souls: Boolean(soulsAccess?.granted),
    administration: Boolean(tasksAccess?.granted || correspondenceAccess?.granted),
    finance: Boolean(financeAccess?.granted),
    patrimony: Boolean(assetsAccess?.granted),
    extensions: Boolean(extensionsAccess?.granted),
  };

  const [
    membersResult,
    departmentsResult,
    assignmentsResult,
    eventsResult,
    attendanceResult,
    soulsResult,
    reportsResult,
    tasksResult,
    correspondenceResult,
    financeResult,
    assetsResult,
    extensionsResult,
    memberMatches,
    assetMatches,
    taskMatches,
  ] = await Promise.all([
    modules.members
      ? admin.from("members").select("id,status,created_at").eq("church_id", churchId).is("archived_at", null).limit(5000)
      : Promise.resolve({ data: [] as any[] }),
    modules.departments
      ? admin.from("departments").select("id,name,status").eq("church_id", churchId).eq("status", "active").limit(500)
      : Promise.resolve({ data: [] as any[] }),
    modules.departments && modules.members
      ? admin.from("member_departments").select("member_id,department_id,status").eq("church_id", churchId).eq("status", "active").limit(10000)
      : Promise.resolve({ data: [] as any[] }),
    modules.attendance
      ? admin.from("events").select("id,title,event_date,status").eq("church_id", churchId).gte("event_date", firstMonthDate).order("event_date").limit(1000)
      : Promise.resolve({ data: [] as any[] }),
    modules.attendance
      ? admin.from("event_attendances").select("event_id,member_id,created_at").eq("church_id", churchId).gte("created_at", `${firstMonthDate}T00:00:00`).limit(10000)
      : Promise.resolve({ data: [] as any[] }),
    modules.souls
      ? admin.from("soul_followups").select("id,full_name,status,source,need_type,created_at,next_followup_date").eq("church_id", churchId).gte("created_at", `${firstMonthDate}T00:00:00`).limit(3000)
      : Promise.resolve({ data: [] as any[] }),
    modules.departments
      ? admin.from("department_monthly_reports").select("department_id,report_month,status,sent_at,validated_at").eq("church_id", churchId).gte("report_month", firstMonthDate).limit(3000)
      : Promise.resolve({ data: [] as any[] }),
    modules.administration
      ? admin.from("admin_tasks").select("id,title,status,priority,due_date,created_at").eq("church_id", churchId).limit(2000)
      : Promise.resolve({ data: [] as any[] }),
    modules.administration
      ? admin.from("admin_correspondences").select("id,reference,subject,type,status,priority,correspondence_date").eq("church_id", churchId).limit(2000)
      : Promise.resolve({ data: [] as any[] }),
    modules.finance
      ? admin.from("finance_transactions").select("id,title,transaction_type,amount_cdf,amount,currency,transaction_date,status").eq("church_id", churchId).neq("status", "archived").gte("transaction_date", firstMonthDate).limit(2000)
      : Promise.resolve({ data: [] as any[] }),
    modules.patrimony
      ? admin.from("patrimony_assets").select("id,name,asset_code,category,status,condition,current_value,acquisition_value,currency,department_id").eq("church_id", churchId).neq("status", "archived").limit(2000)
      : Promise.resolve({ data: [] as any[] }),
    modules.extensions
      ? admin.from("extension_weekly_activities").select("id,extension_id,week_start,total_participants,new_converts_count,new_visitors_count,income_amount,expense_amount,status").eq("church_id", churchId).gte("week_start", firstMonthDate).limit(3000)
      : Promise.resolve({ data: [] as any[] }),
    modules.members
      ? admin.from("members").select("id,first_name,middle_name,last_name,status,phone").eq("church_id", churchId).or(`first_name.ilike.${pattern},middle_name.ilike.${pattern},last_name.ilike.${pattern}`).limit(12)
      : Promise.resolve({ data: [] as any[] }),
    modules.patrimony
      ? admin.from("patrimony_assets").select("id,name,asset_code,status,category,location").eq("church_id", churchId).or(`name.ilike.${pattern},asset_code.ilike.${pattern},location.ilike.${pattern}`).limit(12)
      : Promise.resolve({ data: [] as any[] }),
    modules.administration
      ? admin.from("admin_tasks").select("id,title,status,priority,due_date").eq("church_id", churchId).ilike("title", pattern).limit(12)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const members = membersResult.data ?? [];
  const activeMembers = members.filter((row: any) => row.status === "actif");
  const departments = departmentsResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const events = eventsResult.data ?? [];
  const attendance = attendanceResult.data ?? [];
  const souls = soulsResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const correspondences = correspondenceResult.data ?? [];
  const finances = financeResult.data ?? [];
  const assets = assetsResult.data ?? [];
  const extensionActivities = extensionsResult.data ?? [];

  const departmentNames = new Map(departments.map((row: any) => [row.id, row.name || "Département"]));
  const activeMemberIds = new Set(activeMembers.map((row: any) => row.id));
  const byDepartment = new Map<string, number>();
  for (const row of assignments) {
    if (!activeMemberIds.has(row.member_id)) continue;
    const name = departmentNames.get(row.department_id);
    if (!name) continue;
    byDepartment.set(name, (byDepartment.get(name) || 0) + 1);
  }

  const reportCompletionByMonth = months.map((month) => {
    const submitted = new Set(
      reports
        .filter((row: any) => row.status === "submitted" && String(row.report_month).slice(0, 7) === month)
        .map((row: any) => row.department_id)
    );
    return {
      month,
      label: monthLabel(month),
      value: rate(submitted.size, departments.length),
    };
  });

  const soulsByMonth = months.map((month) => ({
    month,
    label: monthLabel(month),
    value: souls.filter((row: any) => String(row.created_at).slice(0, 7) === month).length,
  }));

  const eventsByMonth = months.map((month) => ({
    month,
    label: monthLabel(month),
    events: events.filter((row: any) => String(row.event_date).slice(0, 7) === month).length,
    attendances: attendance.filter((row: any) => String(row.created_at).slice(0, 7) === month).length,
  }));

  const financeByMonth = months.map((month) => {
    const rows = finances.filter((row: any) => String(row.transaction_date).slice(0, 7) === month);
    const income = rows.filter((row: any) => row.transaction_type === "income").reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);
    const expense = rows.filter((row: any) => row.transaction_type === "expense").reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);
    return { month, label: monthLabel(month), income, expense, balance: income - expense };
  });

  const context = {
    access: modules,
    metrics: {
      membersTotal: members.length,
      membersActive: activeMembers.length,
      departmentsActive: departments.length,
      eventsSixMonths: events.length,
      attendanceRecordsSixMonths: attendance.length,
      soulsSixMonths: souls.length,
      openTasks: tasks.filter((row: any) => !["completed", "cancelled", "archived"].includes(row.status)).length,
      correspondenceTotal: correspondences.length,
      correspondenceProcessedRate: rate(correspondences.filter((row: any) => ["sent", "transmitted", "closed", "archived"].includes(row.status)).length, correspondences.length),
      assetsTotal: assets.length,
      assetsMaintenance: assets.filter((row: any) => row.status === "maintenance").length,
      extensionActivitiesSixMonths: extensionActivities.length,
    },
    analytics: {
      membersByDepartment: Array.from(byDepartment.entries()).map(([label, value]) => ({ label, value })),
      reportCompletionByMonth,
      soulsByMonth,
      eventsByMonth,
      financeByMonth: modules.finance ? financeByMonth : [],
      assetsByCategory: modules.patrimony
        ? Array.from(assets.reduce((map: Map<string, number>, row: any) => {
            const key = row.category || "Autre";
            map.set(key, (map.get(key) || 0) + 1);
            return map;
          }, new Map<string, number>()).entries()).map(([label, value]) => ({ label, value }))
        : [],
    },
    matches: {
      members: (memberMatches.data ?? []).map((row: any) => ({
        id: row.id,
        name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" "),
        status: row.status,
        phone: row.phone,
      })),
      assets: assetMatches.data ?? [],
      tasks: taskMatches.data ?? [],
    },
  };

  const generated = await aiAnswer(question, context);
  if (generated) {
    return NextResponse.json({ ...generated, mode: "ai", contextMetrics: context.metrics });
  }

  const q = question.toLowerCase();
  let chart: Chart | null = null;
  if (q.includes("département") || q.includes("departement")) {
    chart = {
      type: "pie",
      title: "Membres actifs par département",
      labels: context.analytics.membersByDepartment.map((row) => row.label),
      values: context.analytics.membersByDepartment.map((row) => row.value),
    };
  } else if (q.includes("rapport")) {
    chart = {
      type: "bar",
      title: "Complétude des rapports de départements",
      labels: reportCompletionByMonth.map((row) => row.label),
      values: reportCompletionByMonth.map((row) => row.value),
    };
  } else if (q.includes("âme") || q.includes("ame") || q.includes("suivi")) {
    chart = {
      type: "bar",
      title: "Âmes suivies par mois",
      labels: soulsByMonth.map((row) => row.label),
      values: soulsByMonth.map((row) => row.value),
    };
  } else if (q.includes("finance") && modules.finance) {
    chart = {
      type: "bar",
      title: "Solde financier par mois (CDF)",
      labels: financeByMonth.map((row) => row.label),
      values: financeByMonth.map((row) => row.balance),
    };
  }

  const local: AssistantAnswer = {
    answer: `Analyse locale sécurisée : ${context.metrics.membersActive} membre(s) actif(s), ${context.metrics.departmentsActive} département(s) actif(s), ${context.metrics.openTasks} tâche(s) ouverte(s) et ${context.metrics.soulsSixMonths} nouveau(x) suivi(s) d’âme sur six mois. ${modules.finance ? "Les données financières autorisées sont également prises en compte." : "Les données financières ne sont pas accessibles à votre rôle."}`,
    highlights: [
      `Complétude du dernier mois : ${reportCompletionByMonth.at(-1)?.value ?? 0}%.`,
      `Courriers traités : ${context.metrics.correspondenceProcessedRate}%.`,
      `Biens en maintenance : ${context.metrics.assetsMaintenance}.`,
    ],
    chart,
    sources: [
      ...(modules.members ? [{ label: "Membres", href: "/members" }] : []),
      ...(modules.departments ? [{ label: "Rapports départements", href: "/reports/departments" }] : []),
      ...(modules.souls ? [{ label: "Suivi des âmes", href: "/souls" }] : []),
      ...(modules.administration ? [{ label: "Administration", href: "/administration/tasks" }] : []),
      ...(modules.finance ? [{ label: "Finances", href: "/finance" }] : []),
      ...(modules.patrimony ? [{ label: "Patrimoine", href: "/patrimony/assets" }] : []),
    ],
    suggestions: [
      "Montre la répartition des membres par département",
      "Analyse la complétude des rapports des 6 derniers mois",
      "Quelle est l’évolution des âmes suivies ?",
      "Quelles tâches nécessitent une attention ?",
    ],
  };

  return NextResponse.json({ ...local, mode: "local", contextMetrics: context.metrics });
}
