import Link from "next/link";
import { ArrowLeft, Clock3, UserCheck, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberAccountRequestActions from "@/components/settings/MemberAccountRequestActions";
import MemberRowActions from "@/components/members/MemberRowActions";
import { requireChurchAdmin } from "@/lib/security/access";

export const dynamic = "force-dynamic";

function memberName(item: any) {
  return [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" ") || "Membre sans nom";
}

export default async function MemberAccountRequestsPage() {
  const { admin, churchId } = await requireChurchAdmin();

  const [{ data: requests }, { data: pendingMembers }] = await Promise.all([
    admin
      .from("member_account_requests")
      .select("id, member_id, member_code, full_name, email, phone, justification, status, decision_reason, created_at, reviewed_at")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("members")
      .select("id,first_name,middle_name,last_name,email,phone,status,created_at,archived_at")
      .eq("church_id", churchId)
      .eq("status", "en_attente")
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  return (
    <AppShell>
      <div className="space-y-5">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" /> Retour aux paramètres
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">Administration de l’église</p>
              <h1 className="mt-2 text-3xl font-black">Demandes de comptes membres</h1>
              <p className="mt-2 text-sm text-blue-50">
                Cette page regroupe les demandes de compte et les inscriptions membres encore en attente de validation.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-amber-700" />
            <div>
              <h2 className="font-black text-amber-900">Inscriptions membres à valider</h2>
              <p className="mt-1 text-sm text-amber-800">{pendingMembers?.length || 0} dossier(s) en attente.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {(pendingMembers ?? []).map((item: any) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black text-[#03357A]">{memberName(item)}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.email || "Email non renseigné"} {item.phone ? `• ${item.phone}` : ""}</p>
                  <p className="mt-1 text-xs text-slate-400">Reçu le {new Date(item.created_at).toLocaleString("fr-BE")}</p>
                </div>
                <MemberRowActions
                  memberId={item.id}
                  memberName={memberName(item)}
                  status={item.status}
                  archivedAt={item.archived_at}
                />
              </article>
            ))}
            {!pendingMembers?.length && (
              <div className="rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-500">Aucune inscription membre en attente.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#03357A]">Demandes de création de compte</h2>
          <p className="mt-1 text-sm text-slate-500">Demandes envoyées via le parcours de création de compte membre.</p>

          <div className="mt-5 grid gap-4">
            {(requests ?? []).map((item: any) => (
              <article key={item.id} className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[#03357A]">{item.full_name}</h3>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-[#03357A]">{item.member_code || "QR vérifié"}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${item.status === "pending" ? "bg-amber-50 text-amber-700" : item.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-700">{item.email} {item.phone ? `• ${item.phone}` : ""}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.justification || "Aucune justification fournie."}</p>
                    {item.decision_reason && <p className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-600">Décision : {item.decision_reason}</p>}
                    <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {new Date(item.created_at).toLocaleString("fr-BE")}</p>
                  </div>
                  {["pending", "needs_information"].includes(item.status) && (
                    <MemberAccountRequestActions requestId={item.id} />
                  )}
                </div>
              </article>
            ))}
            {!requests?.length && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-[#F8FBFD] p-10 text-center text-slate-500">Aucune demande de création de compte reçue.</div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
