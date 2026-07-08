import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { CHURCH_ROLE_OPTIONS } from "@/lib/roles";
import { createChurchUserAction } from "./actions";

type NewChurchUserPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default async function NewChurchUserPage({
  searchParams,
}: NewChurchUserPageProps) {
  const params = searchParams ? await searchParams : {};

  const errorMessage = params.error
    ? params.error === "required"
      ? "Nom, email et mot de passe de 6 caractères minimum sont obligatoires."
      : `Création impossible : ${decodeURIComponent(params.error)}`
    : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/settings/users"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux utilisateurs
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Paramètres église
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">
                Créer un utilisateur
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Créez un compte rattaché à votre église. Les modules sont ensuite réglés dans Utilisateurs & rôles.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createChurchUserAction} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nom complet">
              <input name="full_name" required placeholder="Nom complet" className={inputClass} />
            </Field>

            <Field label="Email">
              <input name="email" type="email" required placeholder="adresse@email.com" className={inputClass} />
            </Field>

            <Field label="Mot de passe temporaire">
              <input name="password" type="password" required minLength={6} placeholder="Minimum 6 caractères" className={inputClass} />
            </Field>

            <Field label="Statut">
              <select name="status" defaultValue="active" className={inputClass}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="disabled">Désactivé</option>
              </select>
            </Field>

            <Field label="Rôle">
              <select name="role" defaultValue="worker" className={inputClass}>
                {CHURCH_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6 rounded-2xl bg-[#EAF3FA] p-4 text-sm font-bold text-[#03357A]">
            Après création, ouvrez Utilisateurs & rôles pour cocher uniquement les modules autorisés pour ce compte.
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href="/settings/users"
              className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
            >
              Créer le compte
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
