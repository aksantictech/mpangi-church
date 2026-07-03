"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MemberOption = {
  id: string;
  church_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  phone: string | null;
};

type SoulFollowup = {
  id: string;
  church_id: string;
  member_id: string | null;
  full_name: string | null;
  phone: string | null;
  source: string | null;
  need_type: string | null;
  priority: string | null;
  status: string | null;
  first_contact_date: string | null;
  last_contact_date: string | null;
  next_followup_date: string | null;
  notes: string | null;
};

type SoulFollowupEditFormProps = {
  followup: SoulFollowup;
  members: MemberOption[];
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

function getMemberName(member: MemberOption) {
  return [member.first_name, member.last_name, member.middle_name]
    .filter(Boolean)
    .join(" ");
}

export default function SoulFollowupEditForm({
  followup,
  members,
}: SoulFollowupEditFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const filteredMembers = members.filter(
    (member) => member.church_id === followup.church_id
  );

  const [memberId, setMemberId] = useState(followup.member_id ?? "");
  const [fullName, setFullName] = useState(followup.full_name ?? "");
  const [phone, setPhone] = useState(followup.phone ?? "");
  const [source, setSource] = useState(followup.source ?? "visite");
  const [needType, setNeedType] = useState(
    followup.need_type ?? "accompagnement"
  );
  const [priority, setPriority] = useState(followup.priority ?? "normale");
  const [status, setStatus] = useState(followup.status ?? "nouveau");
  const [firstContactDate, setFirstContactDate] = useState(
    followup.first_contact_date ?? ""
  );
  const [lastContactDate, setLastContactDate] = useState(
    followup.last_contact_date ?? ""
  );
  const [nextFollowupDate, setNextFollowupDate] = useState(
    followup.next_followup_date ?? ""
  );
  const [notes, setNotes] = useState(followup.notes ?? "");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleMemberChange(value: string) {
    setMemberId(value);

    const selectedMember = members.find((member) => member.id === value);

    if (selectedMember) {
      setFullName(getMemberName(selectedMember));
      setPhone(selectedMember.phone ?? "");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!fullName.trim()) {
      setErrorMessage("Le nom de la personne est obligatoire.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from("soul_followups")
      .update({
        member_id: memberId || null,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        source,
        need_type: needType,
        priority,
        status,
        first_contact_date: firstContactDate || null,
        last_contact_date: lastContactDate || null,
        next_followup_date: nextFollowupDate || null,
        notes: notes.trim() || null,
      })
      .eq("id", followup.id);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Suivi modifié avec succès.");

    setTimeout(() => {
      router.push(`/souls/${followup.id}`);
      router.refresh();
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Personne accompagnée
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Lier à un membre existant</label>
            <select
              value={memberId}
              onChange={(event) => handleMemberChange(event.target.value)}
              className={inputClass}
            >
              <option value="">Personne externe / non membre</option>

              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {getMemberName(member)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Nom complet *</label>
            <input
              type="text"
              className={inputClass}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Téléphone / WhatsApp</label>
            <input
              type="text"
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Détails du suivi
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Source</label>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className={inputClass}
            >
              <option value="visite">Visite à l’église</option>
              <option value="priere">Demande de prière</option>
              <option value="rendez_vous">Rendez-vous</option>
              <option value="evangelisation">Évangélisation</option>
              <option value="recommandation">Recommandation</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Besoin principal</label>
            <select
              value={needType}
              onChange={(event) => setNeedType(event.target.value)}
              className={inputClass}
            >
              <option value="accompagnement">Accompagnement pastoral</option>
              <option value="integration">Intégration dans l’église</option>
              <option value="priere">Prière</option>
              <option value="formation">Formation / discipolat</option>
              <option value="visite">Visite à domicile</option>
              <option value="urgence">Urgence pastorale</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Priorité</label>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className={inputClass}
            >
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="a_recontacter">À recontacter</option>
              <option value="integre">Intégré</option>
              <option value="cloture">Clôturé</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Premier contact</label>
            <input
              type="date"
              className={inputClass}
              value={firstContactDate}
              onChange={(event) => setFirstContactDate(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Dernier contact</label>
            <input
              type="date"
              className={inputClass}
              value={lastContactDate}
              onChange={(event) => setLastContactDate(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Prochain suivi</label>
            <input
              type="date"
              className={inputClass}
              value={nextFollowupDate}
              onChange={(event) => setNextFollowupDate(event.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <label className={labelClass}>Notes pastorales</label>
            <textarea
              rows={6}
              className={inputClass}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(`/souls/${followup.id}`)}
          className="rounded-2xl border border-[#C9DBEA] px-5 py-3 font-bold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}