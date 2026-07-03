"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
};

type SoulFollowupFormProps = {
  mode: "create" | "edit";
  churchId: string;
  profileId: string;
  members: Member[];
  initialFollowup?: {
    id: string;
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
};

function getMemberName(member: Member) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

export default function SoulFollowupForm({
  mode,
  churchId,
  profileId,
  members,
  initialFollowup,
}: SoulFollowupFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    member_id: initialFollowup?.member_id || "",
    full_name: initialFollowup?.full_name || "",
    phone: initialFollowup?.phone || "",
    source: initialFollowup?.source || "manuel",
    need_type: initialFollowup?.need_type || "accompagnement",
    priority: initialFollowup?.priority || "normale",
    status: initialFollowup?.status || "nouveau",
    first_contact_date: initialFollowup?.first_contact_date || today,
    last_contact_date: initialFollowup?.last_contact_date || today,
    next_followup_date: initialFollowup?.next_followup_date || "",
    notes: initialFollowup?.notes || "",
  });

  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "member_id") {
      const member = members.find((item) => item.id === value);

      if (member) {
        setFormData((current) => ({
          ...current,
          member_id: value,
          full_name: getMemberName(member),
          phone: member.phone || current.phone,
        }));
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.full_name.trim()) {
      alert("Le nom de la personne est obligatoire.");
      return;
    }

    setIsLoading(true);

    const payload = {
      church_id: churchId,
      member_id: formData.member_id || null,
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim() || null,
      source: formData.source || null,
      need_type: formData.need_type || null,
      priority: formData.priority,
      status: formData.status,
      first_contact_date: formData.first_contact_date || null,
      last_contact_date: formData.last_contact_date || null,
      next_followup_date: formData.next_followup_date || null,
      assigned_to: profileId,
created_by: mode === "create" ? profileId : undefined,
      notes: formData.notes.trim() || null,
    };

    if (mode === "create") {
      const { data, error } = await supabase
        .from("soul_followups")
        .insert(payload)
        .select("id")
        .single();

      setIsLoading(false);

      if (error || !data) {
        alert(error?.message || "Erreur lors de la création du suivi.");
        return;
      }

      router.push(`/souls/${data.id}`);
      router.refresh();
      return;
    }

    if (!initialFollowup?.id) {
      setIsLoading(false);
      alert("Suivi pastoral introuvable.");
      return;
    }

    const { error } = await supabase
      .from("soul_followups")
      .update(payload)
      .eq("id", initialFollowup.id)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/souls/${initialFollowup.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <HeartHandshake className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Informations du suivi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Renseignez la personne, le besoin et les dates de suivi.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Associer à un membre existant">
            <select
              value={formData.member_id}
              onChange={(event) => updateField("member_id", event.target.value)}
              className="input"
            >
              <option value="">Aucun membre associé</option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {getMemberName(member) || "Membre sans nom"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nom complet *">
            <input
              value={formData.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              className="input"
              placeholder="Ex : Jean Mukendi"
              required
            />
          </Field>

          <Field label="Téléphone">
            <input
              value={formData.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="input"
              placeholder="+243..."
            />
          </Field>

          <Field label="Source">
            <select
              value={formData.source}
              onChange={(event) => updateField("source", event.target.value)}
              className="input"
            >
              <option value="manuel">Manuel</option>
              <option value="demande_priere">Demande de prière</option>
              <option value="rendez_vous">Rendez-vous</option>
              <option value="demande_integration">Demande d’intégration</option>
              <option value="evangelisation">Évangélisation</option>
              <option value="visite">Visite</option>
            </select>
          </Field>

          <Field label="Besoin">
            <select
              value={formData.need_type}
              onChange={(event) => updateField("need_type", event.target.value)}
              className="input"
            >
              <option value="accompagnement">Accompagnement</option>
              <option value="priere">Prière</option>
              <option value="integration">Intégration</option>
              <option value="conseil">Conseil pastoral</option>
              <option value="delivrance">Délivrance</option>
              <option value="autre">Autre</option>
            </select>
          </Field>

          <Field label="Priorité">
            <select
              value={formData.priority}
              onChange={(event) => updateField("priority", event.target.value)}
              className="input"
            >
              <option value="faible">Faible</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
            </select>
          </Field>

          <Field label="Statut">
            <select
              value={formData.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="input"
            >
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="integre">Intégré</option>
              <option value="cloture">Clôturé</option>
            </select>
          </Field>

          <Field label="Premier contact">
            <input
              type="date"
              value={formData.first_contact_date}
              onChange={(event) =>
                updateField("first_contact_date", event.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Dernier contact">
            <input
              type="date"
              value={formData.last_contact_date}
              onChange={(event) =>
                updateField("last_contact_date", event.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Prochain suivi">
            <input
              type="date"
              value={formData.next_followup_date}
              onChange={(event) =>
                updateField("next_followup_date", event.target.value)
              }
              className="input"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                value={formData.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="min-h-36 w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
                placeholder="Notes pastorales, contexte, besoin exprimé..."
              />
            </Field>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isLoading
            ? "Enregistrement..."
            : mode === "create"
              ? "Créer le suivi"
              : "Enregistrer"}
        </button>
      </div>

      <style jsx>{`
        .input {
          height: 48px;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #dceaf5;
          background: white;
          padding: 0 1rem;
          font-size: 0.875rem;
          outline: none;
          color: #0f172a;
        }

        .input:focus {
          border-color: #03357a;
          box-shadow: 0 0 0 4px rgb(3 53 122 / 0.1);
        }
      `}</style>
    </form>
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
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#03357A]">
        {label}
      </span>

      {children}
    </label>
  );
}