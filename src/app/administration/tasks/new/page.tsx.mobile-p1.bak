import Link from "next/link";
import { ArrowLeft, FileUp, ListChecks, Paperclip } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createAdministrativeTaskAction } from "../actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

type NewTaskPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewAdministrativeTaskPage({
  searchParams,
}: NewTaskPageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");

  const [
    { data: users },
    { data: departments },
    { data: correspondences },
    { data: transmissions },
  ] = await Promise.all([
    admin.from("profiles").select("id, full_name, role").eq("church_id", profile.church_id).eq("status", "active").order("full_name", { ascending: true }),
    admin.from("departments").select("id, name").eq("church_id", profile.church_id).order("name", { ascending: true }),
    admin.from("admin_correspondences").select("id, reference, subject").eq("church_id", profile.church_id).order("created_at", { ascending: false }).limit(100),
    admin.from("admin_document_transmissions").select("id, reference, title").eq("church_id", profile.church_id).order("created_at", { ascending: false }).limit(100),
  ]);

  const errorMessage =
    params.error === "upload"
      ? "Le fichier n’a pas pu être chargé."
      : params.error
        ? "Impossible d’enregistrer la tâche. Vérifiez les champs obligatoires."
        : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/administration/tasks" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour aux tâches
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <ListChecks className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Nouvelle tâche
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">
                Créer une tâche administrative
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Assignez une responsabilité, une échéance, une priorité et un document de suivi.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createAdministrativeTaskAction} className="space-y-5">
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">
              Informations principales
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Titre de la tâche" className="md:col-span-2">
                <input name="title" required placeholder="Ex : Préparer la réponse au courrier..." className={inputClass} />
              </Field>

              <Field label="Catégorie">
                <select name="category" defaultValue="general" className={inputClass}>
                  <option value="general">Générale</option>
                  <option value="correspondence">Courrier</option>
                  <option value="finance">Finance</option>
                  <option value="patrimony">Patrimoine</option>
                  <option value="meeting">Réunion / PV</option>
                  <option value="followup">Suivi</option>
                </select>
              </Field>

              <Field label="Statut">
                <select name="status" defaultValue="todo" className={inputClass}>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="waiting">En attente</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>

              <Field label="Priorité">
                <select name="priority" defaultValue="normal" className={inputClass}>
                  <option value="low">Faible</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </Field>

              <Field label="Responsable">
                <select name="assigned_to" defaultValue="" className={inputClass}>
                  <option value="">Non assigné</option>
                  {(users ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.role || "Utilisateur"} {user.role ? `(${user.role})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Département">
                <select name="department_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun département</option>
                  {(departments ?? []).map((department: any) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date début">
                <input type="date" name="start_date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
              </Field>

              <Field label="Date limite">
                <input type="date" name="due_date" className={inputClass} />
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea name="description" rows={5} placeholder="Détails, consignes, contexte..." className={textareaClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">
              Liaisons administratives
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Optionnel : liez la tâche à un courrier ou une transmission.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Courrier lié">
                <select name="related_correspondence_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun courrier</option>
                  {(correspondences ?? []).map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.reference} — {item.subject}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Transmission liée">
                <select name="related_transmission_id" defaultValue="" className={inputClass}>
                  <option value="">Aucune transmission</option>
                  {(transmissions ?? []).map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.reference} — {item.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lien document externe" className="md:col-span-2">
                <input name="document_url" placeholder="Lien Drive, OneDrive, site web..." className={inputClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <Paperclip className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">
                  Document joint
                </h2>
                <p className="text-sm text-slate-500">
                  Ajoutez un fichier utile à la tâche.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#DCEAF5] bg-[#F8FBFD] px-5 py-8 text-center transition hover:border-[#03357A]/40 hover:bg-[#EAF3FA]">
              <FileUp className="h-10 w-10 text-[#03357A]" />
              <span className="mt-3 text-sm font-extrabold text-[#03357A]">
                Uploader un fichier
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500">
                PDF, image, Word ou Excel.
              </span>
              <input type="file" name="document_file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" className="mt-4 w-full max-w-md rounded-2xl bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#03357A] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
            </label>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link href="/administration/tasks" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
              Annuler
            </Link>
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20">
              Créer la tâche
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-sm font-extrabold text-[#03357A]">{label}</span>
      {children}
    </label>
  );
}
