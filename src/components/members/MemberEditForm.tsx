"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BriefcaseBusiness, Church, Contact, Loader2, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MemberEditFormProps = {
  member: {
    id: string;
    church_id: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    gender: string | null;
    birth_date: string | null;
    address: string | null;
    city: string | null;
    commune: string | null;
    quarter: string | null;
    profession: string | null;
    marital_status: string | null;
    integration_year: number | null;
    spiritual_status: string | null;
    training_notes: string | null;
    notes: string | null;
    member_type: string | null;
    status: string | null;
  };
};

const inputClass = "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#15558F] focus:ring-4 focus:ring-blue-900/10";
const textareaClass = `${inputClass} py-3 leading-6`;

export default function MemberEditForm({ member }: MemberEditFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [formData, setFormData] = useState({
    first_name: member.first_name || "",
    middle_name: member.middle_name || "",
    last_name: member.last_name || "",
    phone: member.phone || "",
    whatsapp: member.whatsapp || "",
    email: member.email || "",
    gender: member.gender || "",
    birth_date: member.birth_date || "",
    address: member.address || "",
    city: member.city || "",
    commune: member.commune || "",
    quarter: member.quarter || "",
    profession: member.profession || "",
    marital_status: member.marital_status || "",
    integration_year: member.integration_year ? String(member.integration_year) : "",
    spiritual_status: member.spiritual_status || "",
    training_notes: member.training_notes || "",
    notes: member.notes || "",
    member_type: member.member_type || "membre",
    status: member.status || "actif",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMessage("Le prénom et le nom sont obligatoires.");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase
      .from("members")
      .update({
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || null,
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        email: formData.email.trim().toLowerCase() || null,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        commune: formData.commune.trim() || null,
        quarter: formData.quarter.trim() || null,
        profession: formData.profession.trim() || null,
        marital_status: formData.marital_status || null,
        integration_year: formData.integration_year ? Number(formData.integration_year) : null,
        spiritual_status: formData.spiritual_status.trim() || null,
        training_notes: formData.training_notes.trim() || null,
        notes: formData.notes.trim() || null,
        member_type: formData.member_type,
        status: formData.status,
      })
      .eq("id", member.id)
      .eq("church_id", member.church_id);
    setIsLoading(false);
    if (error) {
      setErrorMessage(error.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(`/members/${member.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{errorMessage}</div>}

      <FormSection title="Identité" description="Informations légales et personnelles du membre." icon={UserRound}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Prénom *"><input value={formData.first_name} onChange={(event) => updateField("first_name", event.target.value)} className={inputClass} required /></Field>
          <Field label="Post-nom"><input value={formData.middle_name} onChange={(event) => updateField("middle_name", event.target.value)} className={inputClass} /></Field>
          <Field label="Nom *"><input value={formData.last_name} onChange={(event) => updateField("last_name", event.target.value)} className={inputClass} required /></Field>
          <Field label="Genre"><select value={formData.gender} onChange={(event) => updateField("gender", event.target.value)} className={inputClass}><option value="">Non renseigné</option><option value="homme">Homme</option><option value="femme">Femme</option></select></Field>
          <Field label="Date de naissance"><input type="date" value={formData.birth_date} onChange={(event) => updateField("birth_date", event.target.value)} className={inputClass} /></Field>
          <Field label="État civil"><select value={formData.marital_status} onChange={(event) => updateField("marital_status", event.target.value)} className={inputClass}><option value="">Non renseigné</option><option value="celibataire">Célibataire</option><option value="fiance">Fiancé(e)</option><option value="marie">Marié(e)</option><option value="separe">Séparé(e)</option><option value="divorce">Divorcé(e)</option><option value="veuf">Veuf / Veuve</option></select></Field>
        </div>
      </FormSection>

      <FormSection title="Coordonnées" description="Canaux de contact et localisation utiles à l’administration." icon={Contact}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Téléphone"><input type="tel" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClass} placeholder="+243…" /></Field>
          <Field label="WhatsApp"><input type="tel" value={formData.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} className={inputClass} placeholder="+243…" /></Field>
          <Field label="Email"><input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass} placeholder="nom@exemple.com" /></Field>
          <Field label="Profession"><input value={formData.profession} onChange={(event) => updateField("profession", event.target.value)} className={inputClass} /></Field>
          <Field label="Ville"><input value={formData.city} onChange={(event) => updateField("city", event.target.value)} className={inputClass} /></Field>
          <Field label="Commune"><input value={formData.commune} onChange={(event) => updateField("commune", event.target.value)} className={inputClass} /></Field>
          <Field label="Quartier"><input value={formData.quarter} onChange={(event) => updateField("quarter", event.target.value)} className={inputClass} /></Field>
          <Field label="Adresse complète"><input value={formData.address} onChange={(event) => updateField("address", event.target.value)} className={inputClass} /></Field>
        </div>
      </FormSection>

      <FormSection title="Parcours dans l’église" description="Position, intégration et maturité spirituelle." icon={Church}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Type de membre"><select value={formData.member_type} onChange={(event) => updateField("member_type", event.target.value)} className={inputClass}><option value="pasteur">Pasteur</option><option value="responsable">Responsable</option><option value="ouvrier">Ouvrier</option><option value="membre">Membre</option><option value="nouveau_converti">Nouveau converti</option><option value="nouveau_accueilli">Nouveau accueilli</option><option value="visiteur">Visiteur</option><option value="inactif">Inactif</option></select></Field>
          <Field label="Statut du dossier"><select value={formData.status} onChange={(event) => updateField("status", event.target.value)} className={inputClass}><option value="actif">Actif</option><option value="nouveau">Nouveau</option><option value="a_suivre">À suivre</option><option value="en_suivi">En suivi</option><option value="integre">Intégré</option><option value="irregulier">Irrégulier</option><option value="inactif">Inactif</option><option value="suspendu">Suspendu</option><option value="transfere">Transféré</option></select></Field>
          <Field label="Année d’intégration"><input type="number" min="1900" max="2100" value={formData.integration_year} onChange={(event) => updateField("integration_year", event.target.value)} className={inputClass} /></Field>
          <div className="md:col-span-3"><Field label="Statut spirituel"><input value={formData.spiritual_status} onChange={(event) => updateField("spiritual_status", event.target.value)} className={inputClass} placeholder="Baptisé, en formation, nouveau converti…" /></Field></div>
        </div>
      </FormSection>

      <FormSection title="Développement et notes" description="Éléments utiles au suivi administratif du dossier." icon={BriefcaseBusiness}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Notes de formation"><textarea rows={6} value={formData.training_notes} onChange={(event) => updateField("training_notes", event.target.value)} className={textareaClass} placeholder="Formations suivies, compétences développées, étapes à venir…" /></Field>
          <Field label="Notes administratives"><textarea rows={6} value={formData.notes} onChange={(event) => updateField("notes", event.target.value)} className={textareaClass} placeholder="Informations utiles à la gestion du dossier…" /></Field>
        </div>
      </FormSection>

      <div className="sticky bottom-3 z-20 grid gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:grid-cols-[auto_auto] sm:justify-end">
        <button type="button" onClick={() => router.back()} className="min-h-12 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={isLoading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#082F57] px-6 text-sm font-black text-white shadow-lg shadow-blue-950/15 disabled:opacity-60">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{isLoading ? "Enregistrement…" : "Enregistrer les modifications"}</button>
      </div>
    </form>
  );
}

function FormSection({ title, description, icon: Icon, children }: { title: string; description: string; icon: React.ElementType; children: React.ReactNode }) {
  return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#15558F]"><Icon className="h-5 w-5" /></div><div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{description}</p></div></div>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-black text-slate-700">{label}{children}</label>;
}
