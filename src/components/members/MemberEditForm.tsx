"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MemberEditFormProps = {
  member: {
    id: string;
    church_id: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    gender: string | null;
    birth_date: string | null;
    address: string | null;
    city: string | null;
    profession: string | null;
    marital_status: string | null;
    member_type: string | null;
    status: string | null;
  };
};

export default function MemberEditForm({ member }: MemberEditFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    first_name: member.first_name || "",
    middle_name: member.middle_name || "",
    last_name: member.last_name || "",
    phone: member.phone || "",
    email: member.email || "",
    gender: member.gender || "",
    birth_date: member.birth_date || "",
    address: member.address || "",
    city: member.city || "",
    profession: member.profession || "",
    marital_status: member.marital_status || "",
    member_type: member.member_type || "member",
    status: member.status || "actif",
  });

  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.first_name.trim()) {
      alert("Le prénom est obligatoire.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("members")
      .update({
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        profession: formData.profession.trim() || null,
        marital_status: formData.marital_status || null,
        member_type: formData.member_type,
        status: formData.status,
      })
      .eq("id", member.id)
      .eq("church_id", member.church_id);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/members/${member.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#03357A]">
          Identité du membre
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Prénom *">
            <input
              value={formData.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
              className="input"
              placeholder="Ex : Mariame"
              required
            />
          </Field>

          <Field label="Postnom / deuxième nom">
            <input
              value={formData.middle_name}
              onChange={(event) =>
                updateField("middle_name", event.target.value)
              }
              className="input"
              placeholder="Ex : MUNGA"
            />
          </Field>

          <Field label="Nom">
            <input
              value={formData.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
              className="input"
              placeholder="Ex : KABAMBA"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#03357A]">
          Coordonnées
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Téléphone">
            <input
              value={formData.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="input"
              placeholder="+243..."
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="input"
              placeholder="email@example.com"
            />
          </Field>

          <Field label="Adresse">
            <input
              value={formData.address}
              onChange={(event) => updateField("address", event.target.value)}
              className="input"
              placeholder="Adresse complète"
            />
          </Field>

          <Field label="Ville / Commune">
            <input
              value={formData.city}
              onChange={(event) => updateField("city", event.target.value)}
              className="input"
              placeholder="Kinshasa, Limete..."
            />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#03357A]">
          Informations complémentaires
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Genre">
            <select
              value={formData.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              className="input"
            >
              <option value="">Non renseigné</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </Field>

          <Field label="Date de naissance">
            <input
              type="date"
              value={formData.birth_date}
              onChange={(event) => updateField("birth_date", event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Profession">
            <input
              value={formData.profession}
              onChange={(event) => updateField("profession", event.target.value)}
              className="input"
              placeholder="Profession"
            />
          </Field>

          <Field label="État civil">
            <select
              value={formData.marital_status}
              onChange={(event) =>
                updateField("marital_status", event.target.value)
              }
              className="input"
            >
              <option value="">Non renseigné</option>
              <option value="celibataire">Célibataire</option>
              <option value="marie">Marié(e)</option>
              <option value="divorce">Divorcé(e)</option>
              <option value="veuf">Veuf / Veuve</option>
            </select>
          </Field>

          <Field label="Type de membre">
            <select
              value={formData.member_type}
              onChange={(event) =>
                updateField("member_type", event.target.value)
              }
              className="input"
            >
              <option value="member">Membre</option>
              <option value="leader">Leader</option>
              <option value="worker">Ouvrier</option>
              <option value="new_convert">Nouveau converti</option>
              <option value="visitor">Visiteur</option>
            </select>
          </Field>

          <Field label="Statut">
            <select
              value={formData.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="input"
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </Field>
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

          {isLoading ? "Enregistrement..." : "Enregistrer"}
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