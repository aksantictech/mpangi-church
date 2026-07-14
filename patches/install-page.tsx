"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Home,
  QrCode,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import PwaInstallButtonPro from "@/components/pwa/PwaInstallButtonPro";

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <section className="mpangi-mobile-hero mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/15 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Application mobile
          </p>

          <h1 className="mt-3 break-words text-3xl font-black sm:text-5xl">
            Installez Mpangi-church sur votre appareil
          </h1>

          <p className="mt-4 max-w-3xl break-words text-sm leading-7 text-blue-50 sm:text-base">
            Une expérience rapide, accessible depuis l’écran
            d’accueil, avec le logo et l’identité de votre église.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Benefit
              icon={Home}
              title="Accès direct"
              description="Ouvrez votre espace sans rechercher le site."
            />
            <Benefit
              icon={QrCode}
              title="Scanner QR"
              description="Accédez rapidement au pointage des présences."
            />
            <Benefit
              icon={Bell}
              title="Notifications"
              description="Recevez les publications et alertes autorisées."
            />
            <Benefit
              icon={WifiOff}
              title="Résilience"
              description="Certaines ressources restent disponibles après chargement."
            />
            <Benefit
              icon={ShieldCheck}
              title="Espace sécurisé"
              description="L’authentification et les permissions restent appliquées."
            />
            <Benefit
              icon={CheckCircle2}
              title="Identité église"
              description="Le manifeste utilise le sous-domaine et le logo disponibles."
            />
          </div>

          <PwaInstallButtonPro />
        </section>
      </div>
    </main>
  );
}

function Benefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Home;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
      <Icon className="h-6 w-6 text-[#03357A]" />
      <h2 className="mt-4 text-lg font-black text-[#03357A]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}
