import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileUp, Paperclip, Pencil } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { updateTransmissionAction } from "../../actions";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const textareaClass =
  "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

type EditTransmissionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditTransmissionPage({
  params,
  searchParams,
}: EditTransmissionPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("document_transmissions");

  const [
    { data: transmission },
    { data: correspondences },
    { data: departments },
    { data: users },
  ] = await Promise.all([
    admin
      .from("admin_document_transmissions")
      .select("*")
      .eq("church_id", profile.church_id)
      .eq("id", id)
      .maybeSingle(),

    admin
      .from("admin_correspondences")
      .select("id, reference, subject, status")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false })
      .limit(100),

    admin
      .from("departments")
      .select("id, name")
      .eq("church_id", profile.church_id)
      .order("name", { ascending: true }),

    admin
      .from("profiles")
      .select("id, full_name, role")
      .eq("church_id", profile.church_id)
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  if (!transmission) {
    notFound();
  }

  const errorMessage =
    resolvedSearchParams.error === "upload"
      ? "Le nouveau fichier n’a pas pu être chargé. Vérifiez le format ou la taille."
      : resolvedSearchParams.error
        ? "Impossible de modifier la transmission. Vérifiez les champs obligatoires."
        : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/administration/transmissions/${transmission.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la fiche
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Pencil className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Modifier transmission
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                {transmission.reference}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Modifiez le titre, le destinataire, le statut, la priorité, le
                fichier ou les consignes de cette transmission.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={updateTransmissionAction} className="space-y-5">
          <input type="hidden" name="id" value={transmission.id} />

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">
              Informations principales
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Titre de la transmission" className="md:col-span-2">
                <input
                  name="title"
                  required
                  defaultValue={transmission.title || ""}
                  className={inputClass}
                />
              </Field>

              <Field label="Courrier lié">
                <select
                  name="correspondence_id"
                  defaultValue={transmission.correspondence_id || ""}
                  className={inputClass}
                >
                  <option value="">Aucun courrier lié</option>
                  {(correspondences ?? []).map((correspondence: any) => (
                    <option key={correspondence.id} value={correspondence.id}>
                      {correspondence.reference} — {correspondence.subject}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lien document externe">
                <input
                  name="document_url"
                  defaultValue={transmission.document_url || ""}
                  placeholder="Lien Drive, OneDrive, site web..."
                  className={inputClass}
                />
              </Field>

              <Field label="Statut">
                <select
                  name="status"
                  defaultValue={transmission.status || "sent"}
                  className={inputClass}
                >
                  <option value="sent">Envoyé</option>
                  <option value="received">Reçu</option>
                  <option value="read">Lu</option>
                  <option value="in_progress">En traitement</option>
                  <option value="completed">Terminé</option>
                  <option value="returned">Retourné</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>

              <Field label="Priorité">
                <select
                  name="priority"
                  defaultValue={transmission.priority || "normal"}
                  className={inputClass}
                >
                  <option value="low">Faible</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">
              Destinataire
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Responsable destinataire">
                <select
                  name="recipient_profile_id"
                  defaultValue={transmission.recipient_profile_id || ""}
                  className={inputClass}
                >
                  <option value="">Aucun responsable précis</option>
                  {(users ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.role || "Utilisateur"}{" "}
                      {user.role ? `(${user.role})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Département destinataire">
                <select
                  name="recipient_department_id"
                  defaultValue={transmission.recipient_department_id || ""}
                  className={inputClass}
                >
                  <option value="">Aucun département</option>
                  {(departments ?? []).map((department: any) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date limite">
                <input
                  type="date"
                  name="due_date"
                  defaultValue={transmission.due_date || ""}
                  className={inputClass}
                />
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
                  Fichier et instructions
                </h2>
                <p className="text-sm text-slate-500">
                  Laissez le champ fichier vide pour conserver le document actuel.
                </p>
              </div>
            </div>

            {transmission.document_path && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-[#F8FBFD] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-extrabold text-[#03357A]">
                    Document actuel
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {transmission.document_name || "Fichier joint"}
                  </p>
                </div>

                <a
                  href={getDocumentDownloadHref({
                    path: transmission.document_path,
                    filename: transmission.document_name || transmission.reference,
                  })}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]"
                >
                  Télécharger
                </a>
              </div>
            )}

            <div className="grid gap-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#DCEAF5] bg-[#F8FBFD] px-5 py-8 text-center transition hover:border-[#03357A]/40 hover:bg-[#EAF3FA]">
                <FileUp className="h-10 w-10 text-[#03357A]" />
                <span className="mt-3 text-sm font-extrabold text-[#03357A]">
                  Remplacer / ajouter un fichier
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-500">
                  PDF, image, Word ou Excel.
                </span>
                <input
                  type="file"
                  name="document_file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  className="mt-4 w-full max-w-md rounded-2xl bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#03357A] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />
              </label>

              <Field label="Consignes / instructions">
                <textarea
                  name="instructions"
                  rows={5}
                  defaultValue={transmission.instructions || ""}
                  className={textareaClass}
                />
              </Field>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link
              href={`/administration/transmissions/${transmission.id}`}
              className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]"
            >
              Annuler
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20"
            >
              Enregistrer les modifications
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
      <span className="block text-sm font-extrabold text-[#03357A]">
        {label}
      </span>
      {children}
    </label>
  );
}
