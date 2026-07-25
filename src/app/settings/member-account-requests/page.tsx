import { Clock3, UserCheck } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberAccountRequestActions from "@/components/settings/MemberAccountRequestActions";
import { requireChurchAdmin } from "@/lib/security/access";

export default async function MemberAccountRequestsPage() {
  const { admin, churchId } = await requireChurchAdmin();
  const { data: requests } = await admin
    .from("member_account_requests")
    .select("id, member_id, member_code, full_name, email, phone, justification, status, decision_reason, created_at, reviewed_at")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><UserCheck className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">Administration de l’église</p>
              <h1 className="mt-2 text-3xl font-black">Demandes de comptes membres</h1>
              <p className="mt-2 text-sm text-blue-50">Validez uniquement les personnes dont le numéro ou QR correspond à une fiche membre existante.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {(requests ?? []).map((item) => (
            <article key={item.id} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-[#03357A]">{item.full_name}</h2>
                    <span className="rounded-full bg-[#EAF3FA] px-2 py-1 text-xs font-black text-[#03357A]">{item.member_code || "QR vérifié"}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${item.status === "pending" ? "bg-amber-50 text-amber-700" : item.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-700">{item.email} {item.phone ? `• ${item.phone}` : ""}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.justification || "Aucune justification fournie."}</p>
                  {item.decision_reason && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Décision : {item.decision_reason}</p>}
                  <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {new Date(item.created_at).toLocaleString("fr-BE")}</p>
                </div>
                {["pending", "needs_information"].includes(item.status) && <MemberAccountRequestActions requestId={item.id} />}
              </div>
            </article>
          ))}
          {!requests?.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Aucune demande reçue.</div>}
        </section>
      </div>
    </AppShell>
  );
}

