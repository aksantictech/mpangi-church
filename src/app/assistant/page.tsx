import { Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ChurchSearchAssistant from "@/components/assistant/ChurchSearchAssistant";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
export const dynamic = "force-dynamic";
export default async function AssistantPage(){await requireChurchModuleAccess("ai_assistant");return <AppShell><div className="space-y-6"><section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white"><Sparkles className="h-9 w-9"/><h1 className="mt-4 text-3xl font-black">Assistant intelligent</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">Recherchez rapidement ce qui se passe dans votre église. Les résultats restent strictement limités à votre église et aucun contenu n’est partagé entre organisations.</p></section><ChurchSearchAssistant/></div></AppShell>}
