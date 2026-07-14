import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  PlayCircle,
} from "lucide-react";
import {
  createTaskFromTemplateAction,
  updateMyRoleTaskAction,
} from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { getRoleLabel } from "@/lib/security/roleCatalog";

type PageProps = {
  searchParams: Promise<{
    created?: string;
    already?: string;
    error?: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "Bloquée",
  done: "Terminée",
  cancelled: "Annulée",
};

export default async function MyWorkPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const context = await getCurrentSecurityContext();

  if (!context.churchId) {
    return (
      <main className="p-8 text-center">
        Aucune église n’est associée à ce compte.
      </main>
    );
  }

  const admin = createAdminClient();

  const [{ data: tasks }, { data: templates }] =
    await Promise.all([
      admin
        .from("church_user_role_tasks")
        .select("*")
        .eq("church_id", context.churchId)
        .eq("assigned_to", context.userId)
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("church_role_task_templates")
        .select("*")
        .eq("church_id", context.churchId)
        .eq("role_code", context.role)
        .eq("is_active", true)
        .order("priority", { ascending: false }),
    ]);

  const openTasks = (tasks || []).filter(
    (task) =>
      !["done", "cancelled"].includes(task.status)
  );

  const completedTasks = (tasks || []).filter(
    (task) => task.status === "done"
  );

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <ClipboardCheck className="h-8 w-8" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Missions par rôle
          </p>

          <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
            Mon travail
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
            {context.fullName} · {getRoleLabel(context.role)}
          </p>
        </section>

        {query.created === "1" && (
          <Notice type="success">
            La tâche a été créée.
          </Notice>
        )}

        {query.already === "1" && (
          <Notice type="info">
            Cette mission existe déjà pour la période actuelle.
          </Notice>
        )}

        {query.error && (
          <Notice type="error">{query.error}</Notice>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={ClipboardCheck}
            label="Tâches ouvertes"
            value={openTasks.length}
          />
          <Metric
            icon={CheckCircle2}
            label="Tâches terminées"
            value={completedTasks.length}
          />
          <Metric
            icon={CalendarClock}
            label="Missions du rôle"
            value={(templates || []).length}
          />
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            Mes tâches assignées
          </h2>

          {(tasks || []).length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[#F8FBFD] p-6 text-center text-sm font-bold text-slate-500">
              Aucune tâche personnelle pour le moment.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {(tasks || []).map((task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                          {STATUS_LABELS[task.status] || task.status}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                          {task.priority}
                        </span>
                      </div>

                      <h3 className="mt-3 break-words text-lg font-black text-[#03357A]">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                          {task.description}
                        </p>
                      )}

                      {task.due_at && (
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          Échéance :{" "}
                          {new Date(task.due_at).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      )}
                    </div>

                    <form
                      action={updateMyRoleTaskAction}
                      className="flex flex-col gap-2 sm:flex-row"
                    >
                      <input
                        type="hidden"
                        name="task_id"
                        value={task.id}
                      />

                      <select
                        name="status"
                        defaultValue={task.status}
                        className="min-h-11 rounded-xl border border-[#DCEAF5] bg-white px-3 text-sm font-bold text-[#03357A]"
                      >
                        {Object.entries(STATUS_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="submit"
                        className="min-h-11 rounded-xl bg-[#03357A] px-4 text-sm font-black text-white"
                      >
                        Mettre à jour
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            Missions standards de mon rôle
          </h2>

          {(templates || []).length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[#F8FBFD] p-6 text-center text-sm font-bold text-slate-500">
              Aucune mission standard n’est configurée.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(templates || []).map((template) => (
                <article
                  key={template.id}
                  className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                >
                  <h3 className="text-base font-black text-[#03357A]">
                    {template.title}
                  </h3>

                  {template.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {template.description}
                    </p>
                  )}

                  <p className="mt-3 text-xs font-bold text-slate-500">
                    Fréquence : {template.frequency} · Priorité :{" "}
                    {template.priority}
                  </p>

                  <form
                    action={createTaskFromTemplateAction}
                    className="mt-4"
                  >
                    <input
                      type="hidden"
                      name="template_id"
                      value={template.id}
                    />

                    <button
                      type="submit"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#03357A] px-4 text-sm font-black text-white"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Créer cette tâche
                    </button>
                  </form>
                </article>
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
  icon: typeof ClipboardCheck;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm">
      <Icon className="h-6 w-6 text-[#03357A]" />
      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value}
      </p>
    </article>
  );
}

function Notice({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "success" | "info" | "error";
}) {
  const styles =
    type === "success"
      ? "bg-green-50 text-green-700"
      : type === "error"
        ? "bg-red-50 text-red-700"
        : "bg-blue-50 text-blue-700";

  return (
    <div className={`mt-4 rounded-2xl p-4 text-sm font-bold ${styles}`}>
      {children}
    </div>
  );
}
