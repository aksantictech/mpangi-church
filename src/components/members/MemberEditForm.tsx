"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpenCheck, BriefcaseBusiness, Church, Contact, HeartHandshake, Loader2, Save, UserRound, UsersRound } from "lucide-react";
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
    preferred_name: string | null;
    family_name: string | null;
    family_role: string | null;
    spouse_name: string | null;
    children_names: string | null;
    anniversary_date: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relationship: string | null;
    conversion_date: string | null;
    baptism_date: string | null;
    membership_date: string | null;
    previous_church: string | null;
    discipleship_stage: string | null;
    mentor_name: string | null;
    training_goal: string | null;
    last_training_review_date: string | null;
    small_group: string | null;
    ministry_interests: string | null;
    spiritual_gifts: string | null;
    volunteer_availability: string | null;
  };
  trainingPrograms: Array<{ id: string; name: string }>;
  trainingAssignments: Array<{ id: string; training_program_id: string | null }>;
};

const inputClass = "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#15558F] focus:ring-4 focus:ring-blue-900/10";
const textareaClass = `${inputClass} py-3 leading-6`;

export default function MemberEditForm({ member, trainingPrograms, trainingAssignments }: MemberEditFormProps) {
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
    preferred_name: member.preferred_name || "",
    family_name: member.family_name || "",
    family_role: member.family_role || "",
    spouse_name: member.spouse_name || "",
    children_names: member.children_names || "",
    anniversary_date: member.anniversary_date || "",
    emergency_contact_name: member.emergency_contact_name || "",
    emergency_contact_phone: member.emergency_contact_phone || "",
    emergency_contact_relationship: member.emergency_contact_relationship || "",
    conversion_date: member.conversion_date || "",
    baptism_date: member.baptism_date || "",
    membership_date: member.membership_date || "",
    previous_church: member.previous_church || "",
    discipleship_stage: member.discipleship_stage || "",
    mentor_name: member.mentor_name || "",
    training_goal: member.training_goal || "",
    last_training_review_date: member.last_training_review_date || "",
    small_group: member.small_group || "",
    ministry_interests: member.ministry_interests || "",
    spiritual_gifts: member.spiritual_gifts || "",
    volunteer_availability: member.volunteer_availability || "",
  });
  const [selectedTrainingIds, setSelectedTrainingIds] = useState(
    trainingAssignments.map((assignment) => assignment.training_program_id).filter(Boolean) as string[]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function toggleTraining(trainingId: string) {
    setSelectedTrainingIds((current) => current.includes(trainingId)
      ? current.filter((id) => id !== trainingId)
      : [...current, trainingId]);
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
        preferred_name: formData.preferred_name.trim() || null,
        family_name: formData.family_name.trim() || null,
        family_role: formData.family_role || null,
        spouse_name: formData.spouse_name.trim() || null,
        children_names: formData.children_names.trim() || null,
        anniversary_date: formData.anniversary_date || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        emergency_contact_relationship: formData.emergency_contact_relationship.trim() || null,
        conversion_date: formData.conversion_date || null,
        baptism_date: formData.baptism_date || null,
        membership_date: formData.membership_date || null,
        previous_church: formData.previous_church.trim() || null,
        discipleship_stage: formData.discipleship_stage || null,
        mentor_name: formData.mentor_name.trim() || null,
        training_goal: formData.training_goal.trim() || null,
        last_training_review_date: formData.last_training_review_date || null,
        small_group: formData.small_group.trim() || null,
        ministry_interests: formData.ministry_interests.trim() || null,
        spiritual_gifts: formData.spiritual_gifts.trim() || null,
        volunteer_availability: formData.volunteer_availability.trim() || null,
      })
      .eq("id", member.id)
      .eq("church_id", member.church_id);
    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const currentProgramIds = new Set(trainingAssignments.map((assignment) => assignment.training_program_id).filter(Boolean) as string[]);
    const assignmentIdsToRemove = trainingAssignments
      .filter((assignment) => assignment.training_program_id && !selectedTrainingIds.includes(assignment.training_program_id))
      .map((assignment) => assignment.id);
    const programIdsToAdd = selectedTrainingIds.filter((id) => !currentProgramIds.has(id));

    if (assignmentIdsToRemove.length) {
      const { error: removeError } = await supabase.from("member_trainings").delete().in("id", assignmentIdsToRemove).eq("member_id", member.id).eq("church_id", member.church_id);
      if (removeError) {
        setIsLoading(false);
        setErrorMessage(removeError.message);
        return;
      }
    }
    if (programIdsToAdd.length) {
      const { error: trainingError } = await supabase.from("member_trainings").insert(programIdsToAdd.map((programId) => ({
        church_id: member.church_id,
        member_id: member.id,
        training_program_id: programId,
        status: "en_cours",
        completed: false,
        started_at: new Date().toISOString().slice(0, 10),
      })));
      if (trainingError) {
        setIsLoading(false);
        setErrorMessage(trainingError.message);
        return;
      }
    }

    setIsLoading(false);
    router.push(`/members/${member.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{errorMessage}</div>}

      <FormSection title="Identité" description="Informations légales et personnelles du membre." icon={UserRound}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Prénom *"><input value={formData.first_name} onChange={(event) => updateField("first_name", event.target.value)} className={inputClass} required /></Field>
          <Field label="Prénom d’usage"><input value={formData.preferred_name} onChange={(event) => updateField("preferred_name", event.target.value)} className={inputClass} placeholder="Nom utilisé dans la communauté" /></Field>
          <Field label="Post-nom"><input value={formData.middle_name} onChange={(event) => updateField("middle_name", event.target.value)} className={inputClass} /></Field>
          <Field label="Nom *"><input value={formData.last_name} onChange={(event) => updateField("last_name", event.target.value)} className={inputClass} required /></Field>
          <Field label="Genre"><select value={formData.gender} onChange={(event) => updateField("gender", event.target.value)} className={inputClass}><option value="">Non renseigné</option><option value="homme">Homme</option><option value="femme">Femme</option></select></Field>
          <Field label="Date de naissance"><input type="date" value={formData.birth_date} onChange={(event) => updateField("birth_date", event.target.value)} className={inputClass} /></Field>
          <Field label="État civil"><select value={formData.marital_status} onChange={(event) => updateField("marital_status", event.target.value)} className={inputClass}><option value="">Non renseigné</option><option value="celibataire">Célibataire</option><option value="fiance">Fiancé(e)</option><option value="marie">Marié(e)</option><option value="separe">Séparé(e)</option><option value="divorce">Divorcé(e)</option><option value="veuf">Veuf / Veuve</option></select></Field>
        </div>
      </FormSection>

      <FormSection title="Famille et personnes à contacter" description="Regroupez le foyer et gardez un contact fiable en cas de besoin." icon={HeartHandshake}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom du foyer / famille"><input value={formData.family_name} onChange={(event) => updateField("family_name", event.target.value)} className={inputClass} placeholder="Ex : Famille Kalema" /></Field>
          <Field label="Rôle dans la famille"><select value={formData.family_role} onChange={(event) => updateField("family_role", event.target.value)} className={inputClass}><option value="">Non renseigné</option><option value="responsable">Responsable du foyer</option><option value="conjoint">Conjoint(e)</option><option value="enfant">Enfant</option><option value="parent">Parent</option><option value="autre">Autre proche</option></select></Field>
          <Field label="Conjoint(e)"><input value={formData.spouse_name} onChange={(event) => updateField("spouse_name", event.target.value)} className={inputClass} placeholder="Nom complet" /></Field>
          <Field label="Anniversaire de mariage"><input type="date" value={formData.anniversary_date} onChange={(event) => updateField("anniversary_date", event.target.value)} className={inputClass} /></Field>
          <div className="md:col-span-2"><Field label="Enfants / personnes du foyer"><textarea rows={3} value={formData.children_names} onChange={(event) => updateField("children_names", event.target.value)} className={textareaClass} placeholder="Noms et liens familiaux utiles" /></Field></div>
          <Field label="Contact d’urgence"><input value={formData.emergency_contact_name} onChange={(event) => updateField("emergency_contact_name", event.target.value)} className={inputClass} placeholder="Nom complet" /></Field>
          <Field label="Lien avec le membre"><input value={formData.emergency_contact_relationship} onChange={(event) => updateField("emergency_contact_relationship", event.target.value)} className={inputClass} placeholder="Conjoint, parent, proche…" /></Field>
          <Field label="Téléphone d’urgence"><input type="tel" value={formData.emergency_contact_phone} onChange={(event) => updateField("emergency_contact_phone", event.target.value)} className={inputClass} placeholder="+243…" /></Field>
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
          <Field label="Date de conversion"><input type="date" value={formData.conversion_date} onChange={(event) => updateField("conversion_date", event.target.value)} className={inputClass} /></Field>
          <Field label="Date de baptême"><input type="date" value={formData.baptism_date} onChange={(event) => updateField("baptism_date", event.target.value)} className={inputClass} /></Field>
          <Field label="Date d’adhésion"><input type="date" value={formData.membership_date} onChange={(event) => updateField("membership_date", event.target.value)} className={inputClass} /></Field>
          <Field label="Étape du parcours"><select value={formData.discipleship_stage} onChange={(event) => updateField("discipleship_stage", event.target.value)} className={inputClass}><option value="">À définir</option><option value="accueil">Accueil / découverte</option><option value="nouvelle_naissance">Nouvelle naissance</option><option value="fondements">Fondements de la foi</option><option value="bapteme">Préparation au baptême</option><option value="integration">Intégration</option><option value="service">Service actif</option><option value="leadership">Leadership</option><option value="maturite">Maturité / mentorat</option></select></Field>
          <Field label="Mentor / accompagnateur"><input value={formData.mentor_name} onChange={(event) => updateField("mentor_name", event.target.value)} className={inputClass} placeholder="Responsable du suivi" /></Field>
          <Field label="Église précédente"><input value={formData.previous_church} onChange={(event) => updateField("previous_church", event.target.value)} className={inputClass} /></Field>
          <div className="md:col-span-3"><Field label="Statut spirituel"><input value={formData.spiritual_status} onChange={(event) => updateField("spiritual_status", event.target.value)} className={inputClass} placeholder="Résumé libre du parcours spirituel" /></Field></div>
        </div>
      </FormSection>

      <FormSection title="Vie de l’église" description="Groupes, service, dons et disponibilité du membre." icon={UsersRound}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cellule / groupe de maison"><input value={formData.small_group} onChange={(event) => updateField("small_group", event.target.value)} className={inputClass} placeholder="Nom du groupe ou de la cellule" /></Field>
          <Field label="Disponibilités pour servir"><input value={formData.volunteer_availability} onChange={(event) => updateField("volunteer_availability", event.target.value)} className={inputClass} placeholder="Dimanche matin, soirées, ponctuel…" /></Field>
          <Field label="Dons, talents et compétences"><textarea rows={4} value={formData.spiritual_gifts} onChange={(event) => updateField("spiritual_gifts", event.target.value)} className={textareaClass} placeholder="Musique, enseignement, accueil, technique…" /></Field>
          <Field label="Ministères ou services souhaités"><textarea rows={4} value={formData.ministry_interests} onChange={(event) => updateField("ministry_interests", event.target.value)} className={textareaClass} placeholder="Domaines dans lesquels le membre souhaite servir" /></Field>
        </div>
      </FormSection>

      <FormSection title="Suivi des formations" description="Inscription aux parcours et prochaine étape de développement." icon={BookOpenCheck}>
        {trainingPrograms.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{trainingPrograms.map((training) => <label key={training.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-black transition ${selectedTrainingIds.includes(training.id) ? "border-[#15558F] bg-blue-50 text-[#15558F]" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"}`}><input type="checkbox" checked={selectedTrainingIds.includes(training.id)} onChange={() => toggleTraining(training.id)} className="h-4 w-4 rounded border-slate-300" />{training.name}</label>)}</div> : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">Aucun programme de formation actif n’est configuré.</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Prochaine étape / objectif"><textarea rows={4} value={formData.training_goal} onChange={(event) => updateField("training_goal", event.target.value)} className={textareaClass} placeholder="Formation à suivre, compétence à développer, échéance…" /></Field>
          <div className="space-y-4"><Field label="Dernière revue du parcours"><input type="date" value={formData.last_training_review_date} onChange={(event) => updateField("last_training_review_date", event.target.value)} className={inputClass} /></Field><Field label="Notes de formation"><textarea rows={3} value={formData.training_notes} onChange={(event) => updateField("training_notes", event.target.value)} className={textareaClass} placeholder="Progression, difficultés, recommandations…" /></Field></div>
        </div>
      </FormSection>

      <FormSection title="Développement et notes" description="Éléments utiles au suivi administratif du dossier." icon={BriefcaseBusiness}>
        <Field label="Notes administratives"><textarea rows={6} value={formData.notes} onChange={(event) => updateField("notes", event.target.value)} className={textareaClass} placeholder="Informations internes utiles à la gestion du dossier…" /></Field>
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
