import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createTeachingAction } from "../actions";

type NewTeachingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default async function NewTeachingPage({
  searchParams,
}: NewTeachingPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/teachings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux enseignements
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Enseignements
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">
            Nouvel enseignement
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Ajoutez un lien YouTube. La vidéo sera lue directement dans l’application.
          </p>
        </section>

        {params.error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            Vérifiez le titre et le lien YouTube.
          </div>
        )}

        <form
          action={createTeachingAction}
          className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
        >
          <TeachingFormFields />

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href="/teachings"
              className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]"
            >
              Annuler
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function TeachingFormFields() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Titre">
        <input name="title" required placeholder="Titre de l’enseignement" className={inputClass} />
      </Field>

      <Field label="Lien YouTube">
        <input name="youtube_url" required placeholder="https://www.youtube.com/watch?v=..." className={inputClass} />
      </Field>

      <Field label="Prédicateur / enseignant">
        <input name="teacher_name" placeholder="Nom du prédicateur" className={inputClass} />
      </Field>

      <Field label="Catégorie">
        <input name="category" placeholder="Foi, famille, prière..." className={inputClass} />
      </Field>

      <Field label="Statut">
        <select name="status" defaultValue="draft" className={inputClass}>
          <option value="draft">Brouillon</option>
          <option value="published">Publier maintenant</option>
        </select>
      </Field>

      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold text-[#03357A]">
        <input name="is_featured" type="checkbox" />
        Mettre en avant
      </label>

      <Field label="Description">
        <textarea
          name="description"
          rows={5}
          placeholder="Résumé ou description"
          className={`${inputClass} py-3 md:col-span-2`}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-extrabold text-[#03357A]">
        {label}
      </span>
      {children}
    </label>
  );
}
