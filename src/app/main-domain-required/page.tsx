import Link from "next/link";
import { ArrowLeft, Building2, LockKeyhole } from "lucide-react";

export default function MainDomainRequiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4 py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-[#DCEAF5] bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF3FA] text-[#03357A]">
          <LockKeyhole className="h-8 w-8" />
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.28em] text-[#2563EB]">
          Accès privé protégé
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#03357A]">
          Utilisez le domaine privé de votre église
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Le domaine principal <strong>mpangi-church.app</strong> est réservé à
          la page générale publique. Les dashboards des églises doivent être
          ouverts depuis leur sous-domaine privé.
        </p>

        <div className="mt-6 rounded-3xl bg-[#F8FBFD] p-5 text-left">
          <div className="flex items-start gap-3">
            <Building2 className="mt-1 h-5 w-5 shrink-0 text-[#03357A]" />
            <div>
              <h2 className="font-black text-[#03357A]">Exemples</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Maison de Miséricorde : <strong>mdm.mpangi-church.app</strong>
                <br />
                ICC Kinshasa : <strong>icckinshasa.mpangi-church.app</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-black text-[#03357A]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour accueil
          </Link>

          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
          >
            Page de connexion
          </Link>
        </div>
      </section>
    </main>
  );
}
