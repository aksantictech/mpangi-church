import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  HardDrive,
  Smartphone,
  Wifi,
} from "lucide-react";

const checks = [
  {
    title: "Navigation mobile",
    description:
      "Menu supérieur, barre publique et liens principaux.",
    icon: Smartphone,
  },
  {
    title: "Performance",
    description:
      "Poids des ressources, chargements et animations.",
    icon: Gauge,
  },
  {
    title: "Réseau",
    description:
      "Comportement sur connexion lente et économie de données.",
    icon: Wifi,
  },
  {
    title: "Maintenance",
    description:
      "Backups, scripts temporaires et fichiers volumineux.",
    icon: HardDrive,
  },
];

export default function MobileMaintenancePage() {
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

        <section className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <Activity className="h-8 w-8" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Maintenance mobile
          </p>

          <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
            Contrôle de stabilité Mpangi-church
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
            Cette page sert de rappel opérationnel. Les audits
            détaillés sont générés depuis les scripts de maintenance.
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {checks.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-5 shadow-sm"
              >
                <Icon className="h-6 w-6 text-[#03357A]" />

                <h2 className="mt-4 text-lg font-black text-[#03357A]">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  À vérifier après chaque déploiement
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#03357A]">
            Commandes de maintenance
          </h2>

          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{`node scripts/audit-mobile-performance.js
node scripts/audit-public-assets.js
node scripts/audit-backup-files.js
npm run build`}
          </pre>
        </section>
      </div>
    </main>
  );
}
