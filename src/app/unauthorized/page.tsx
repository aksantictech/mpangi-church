import Link from "next/link";
import { LockKeyhole } from "lucide-react";

type UnauthorizedPageProps = {
  searchParams?: Promise<{
    reason?: string;
    module?: string;
  }>;
};

const reasonLabels: Record<string, string> = {
  inactive: "Votre compte est désactivé.",
  super_admin_required: "Cette page est réservée au super administrateur.",
  church_required: "Votre compte n’est rattaché à aucune église.",
  church_admin_required: "Cette page est réservée à l’administration de l’église.",
  module_disabled: "Ce module n’est pas activé pour votre église.",
  profile_permission_denied: "Votre compte n’a pas cette permission personnalisée.",
  role_permission_denied: "Votre rôle n’a pas cette permission.",
  fallback_permission_denied: "Votre rôle n’est pas autorisé à accéder à cette page.",
  profile_other_church: "Ce profil appartient à une autre église.",
};

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const params = searchParams ? await searchParams : {};
  const reason = params.reason || "denied";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4 py-10">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#DCEAF5] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-700">
          <LockKeyhole className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-3xl font-black text-[#03357A]">
          Accès non autorisé
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          {reasonLabels[reason] || "Vous n’avez pas les droits nécessaires pour ouvrir cette page."}
        </p>

        {params.module && (
          <p className="mt-3 rounded-2xl bg-[#F8FBFD] px-4 py-3 text-xs font-bold text-slate-500">
            Module concerné : {params.module}
          </p>
        )}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
          >
            Retour au dashboard
          </Link>

          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]"
          >
            Paramètres
          </Link>
        </div>
      </section>
    </main>
  );
}
