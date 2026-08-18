import { BarChart3, Database, ShieldCheck, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ChurchSearchAssistant from "@/components/assistant/ChurchSearchAssistant";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  await requireChurchModuleAccess("ai_assistant");

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
          <Sparkles className="h-9 w-9" />
          <h1 className="mt-4 text-3xl font-black">Assistant intelligent</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Posez une vraie question de gestion. L’assistant agrège uniquement les données
            autorisées pour votre rôle, calcule les indicateurs, structure la réponse et peut
            générer un graphique adapté à la question.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Feature icon={Database} title="Données réelles" text="Membres, rapports, présences, âmes, administration, finances ou patrimoine selon vos droits." />
          <Feature icon={BarChart3} title="Analyse et graphiques" text="Comparaisons, tendances, pourcentages, répartitions et graphiques à partir des agrégats calculés côté serveur." />
          <Feature icon={ShieldCheck} title="Isolation stricte" text="Aucune requête libre de l’IA vers la base : le serveur prépare d’abord le contexte limité à votre église et à vos permissions." />
        </section>

        <ChurchSearchAssistant />
      </div>
    </AppShell>
  );
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#DCEAF5] bg-white p-4">
      <Icon className="h-5 w-5 text-blue-600" />
      <p className="mt-3 font-black text-[#03357A]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
