"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, GraduationCap, HeartHandshake, Save, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ChurchOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  church_id: string;
  name: string;
};

type TrainingProgramOption = {
  id: string;
  church_id: string;
  name: string;
};

type Profile = {
  id: string;
  church_id: string | null;
  role: string;
};

type MemberFormProps = {
  profile: Profile;
  churches: ChurchOption[];
  departments: DepartmentOption[];
  trainingPrograms: TrainingProgramOption[];
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

export default function MemberForm({
  profile,
  churches,
  departments,
  trainingPrograms,
}: MemberFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [churchId, setChurchId] = useState(
    profile.church_id ?? churches[0]?.id ?? ""
  );

  const filteredDepartments = departments.filter(
    (department) => department.church_id === churchId
  );

  const filteredTrainingPrograms = trainingPrograms.filter(
    (training) => training.church_id === churchId
  );

  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);

  const [firstName, setFirstName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [commune, setCommune] = useState("");
  const [quarter, setQuarter] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [profession, setProfession] = useState("");
  const [integrationYear, setIntegrationYear] = useState("");
  const [memberType, setMemberType] = useState("membre");
  const [spiritualStatus, setSpiritualStatus] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [status, setStatus] = useState("actif");
  const [familyName, setFamilyName] = useState("");
  const [familyRole, setFamilyRole] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [childrenNames, setChildrenNames] = useState("");
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("");
  const [conversionDate, setConversionDate] = useState("");
  const [baptismDate, setBaptismDate] = useState("");
  const [membershipDate, setMembershipDate] = useState("");
  const [previousChurch, setPreviousChurch] = useState("");
  const [discipleshipStage, setDiscipleshipStage] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [trainingGoal, setTrainingGoal] = useState("");
  const [lastTrainingReviewDate, setLastTrainingReviewDate] = useState("");
  const [smallGroup, setSmallGroup] = useState("");
  const [ministryInterests, setMinistryInterests] = useState("");
  const [spiritualGifts, setSpiritualGifts] = useState("");
  const [volunteerAvailability, setVolunteerAvailability] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function toggleTraining(trainingId: string) {
    setSelectedTrainingIds((current) => {
      if (current.includes(trainingId)) {
        return current.filter((id) => id !== trainingId);
      }

      return [...current, trainingId];
    });
  }

  function handleChurchChange(value: string) {
    setChurchId(value);
    setSelectedDepartmentId("");
    setSelectedTrainingIds([]);
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];

  if (!file) {
    setPhotoFile(null);
    setPhotoPreview("");
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    setErrorMessage("Format non accepté. Utilisez JPG, PNG ou WEBP.");
    setPhotoFile(null);
    setPhotoPreview("");
    return;
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    setErrorMessage("La photo ne doit pas dépasser 5 MB.");
    setPhotoFile(null);
    setPhotoPreview("");
    return;
  }

  setErrorMessage("");
  setPhotoFile(file);
  setPhotoPreview(URL.createObjectURL(file));
}

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!churchId) {
      setErrorMessage("Aucune église sélectionnée.");
      setIsLoading(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Le nom et le prénom sont obligatoires.");
      setIsLoading(false);
      return;
    }

let uploadedPhotoUrl: string | null = null;

if (photoFile) {
  const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${churchId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("member-photos")
    .upload(filePath, photoFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    setErrorMessage(uploadError.message);
    setIsLoading(false);
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from("member-photos")
    .getPublicUrl(filePath);

  uploadedPhotoUrl = publicUrlData.publicUrl;
}

    const qrCode = `mpangi-member-${crypto.randomUUID()}`;

    const { data: member, error } = await supabase
      .from("members")
      .insert({
        church_id: churchId,
        first_name: firstName.trim(),
        preferred_name: preferredName.trim() || null,
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null,
        gender: gender || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        photo_url: uploadedPhotoUrl,
        address: address.trim() || null,
        city: city.trim() || null,
        commune: commune.trim() || null,
        quarter: quarter.trim() || null,
        birth_date: birthDate || null,
        marital_status: maritalStatus || null,
        profession: profession.trim() || null,
        integration_year: integrationYear ? Number(integrationYear) : null,
        member_type: memberType,
        spiritual_status: spiritualStatus.trim() || null,
        training_notes: trainingNotes.trim() || null,
        qr_code: qrCode,
        status,
        created_by: profile.id,
        family_name: familyName.trim() || null,
        family_role: familyRole || null,
        spouse_name: spouseName.trim() || null,
        children_names: childrenNames.trim() || null,
        anniversary_date: anniversaryDate || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        emergency_contact_relationship: emergencyContactRelationship.trim() || null,
        conversion_date: conversionDate || null,
        baptism_date: baptismDate || null,
        membership_date: membershipDate || null,
        previous_church: previousChurch.trim() || null,
        discipleship_stage: discipleshipStage || null,
        mentor_name: mentorName.trim() || null,
        training_goal: trainingGoal.trim() || null,
        last_training_review_date: lastTrainingReviewDate || null,
        small_group: smallGroup.trim() || null,
        ministry_interests: ministryInterests.trim() || null,
        spiritual_gifts: spiritualGifts.trim() || null,
        volunteer_availability: volunteerAvailability.trim() || null,
      })
      .select("id")
      .single();

    if (error || !member) {
      setErrorMessage(error?.message ?? "Erreur lors de l’ajout du membre.");
      setIsLoading(false);
      return;
    }

    if (selectedDepartmentId) {
      const { error: departmentError } = await supabase
        .from("member_departments")
        .insert({
          church_id: churchId,
          department_id: selectedDepartmentId,
          member_id: member.id,
          role: "member",
          status: "active",
          assigned_at: new Date().toISOString().slice(0, 10),
        });

      if (departmentError) {
        setErrorMessage(departmentError.message);
        setIsLoading(false);
        return;
      }
    }

    if (selectedTrainingIds.length > 0) {
      const trainingRows = selectedTrainingIds.map((trainingId) => ({
        church_id: churchId,
        member_id: member.id,
        training_program_id: trainingId,
        status: "en_cours",
        completed: false,
        started_at: new Date().toISOString().slice(0, 10),
        created_by: profile.id,
      }));

      const { error: trainingError } = await supabase
        .from("member_trainings")
        .insert(trainingRows);

      if (trainingError) {
        setErrorMessage(trainingError.message);
        setIsLoading(false);
        return;
      }
    }

    setSuccessMessage("Membre ajouté avec succès.");

    setTimeout(() => {
      router.push("/members");
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

      {profile.role === "super_admin" && (
        <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
          <label className={labelClass}>Église *</label>
          <select
            value={churchId}
            onChange={(event) => handleChurchChange(event.target.value)}
            className={inputClass}
            required
          >
            <option value="">Sélectionner une église</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Identité du membre
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Prénom *</label>
            <input
              type="text"
              className={inputClass}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Prénom d’usage</label>
            <input type="text" className={inputClass} value={preferredName} onChange={(event) => setPreferredName(event.target.value)} placeholder="Nom utilisé dans la communauté" />
          </div>

          <div>
            <label className={labelClass}>Nom *</label>
            <input
              type="text"
              className={inputClass}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Post-nom</label>
            <input
              type="text"
              className={inputClass}
              value={middleName}
              onChange={(event) => setMiddleName(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Sexe</label>
            <select
              className={inputClass}
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">Non renseigné</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Date de naissance</label>
            <input
              type="date"
              className={inputClass}
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>État civil</label>
            <select
              className={inputClass}
              value={maritalStatus}
              onChange={(event) => setMaritalStatus(event.target.value)}
            >
              <option value="">Non renseigné</option>
              <option value="celibataire">Célibataire</option>
              <option value="marie">Marié(e)</option>
              <option value="veuf">Veuf / Veuve</option>
              <option value="divorce">Divorcé(e)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-violet-100 bg-violet-50/40 p-5">
        <div className="flex items-center gap-3"><HeartHandshake className="h-6 w-6 text-violet-700" /><div><h2 className="text-lg font-extrabold text-[#03357A]">Famille et contact d’urgence</h2><p className="mt-1 text-sm text-slate-500">Regroupez le foyer et identifiez une personne à joindre en cas de besoin.</p></div></div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div><label className={labelClass}>Nom du foyer / famille</label><input className={inputClass} value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Ex : Famille Kalema" /></div>
          <div><label className={labelClass}>Rôle dans la famille</label><select className={inputClass} value={familyRole} onChange={(event) => setFamilyRole(event.target.value)}><option value="">Non renseigné</option><option value="responsable">Responsable du foyer</option><option value="conjoint">Conjoint(e)</option><option value="enfant">Enfant</option><option value="parent">Parent</option><option value="autre">Autre proche</option></select></div>
          <div><label className={labelClass}>Conjoint(e)</label><input className={inputClass} value={spouseName} onChange={(event) => setSpouseName(event.target.value)} placeholder="Nom complet" /></div>
          <div><label className={labelClass}>Anniversaire de mariage</label><input type="date" className={inputClass} value={anniversaryDate} onChange={(event) => setAnniversaryDate(event.target.value)} /></div>
          <div className="md:col-span-2"><label className={labelClass}>Enfants / personnes du foyer</label><textarea rows={3} className={inputClass} value={childrenNames} onChange={(event) => setChildrenNames(event.target.value)} placeholder="Noms et liens familiaux utiles" /></div>
          <div><label className={labelClass}>Contact d’urgence</label><input className={inputClass} value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} placeholder="Nom complet" /></div>
          <div><label className={labelClass}>Lien avec le membre</label><input className={inputClass} value={emergencyContactRelationship} onChange={(event) => setEmergencyContactRelationship(event.target.value)} placeholder="Conjoint, parent, proche…" /></div>
          <div><label className={labelClass}>Téléphone d’urgence</label><input type="tel" className={inputClass} value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} placeholder="+243…" /></div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
  <div className="flex items-center gap-3">
    <Camera className="h-6 w-6 text-[#03357A]" />
    <h2 className="text-lg font-extrabold text-[#03357A]">
      Photo du membre
    </h2>
  </div>

  <div className="mt-5 grid gap-5 md:grid-cols-[0.35fr_1fr]">
    <div className="flex h-44 items-center justify-center overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white">
      {photoPreview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoPreview}
          alt="Aperçu photo membre"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="text-center">
          <Camera className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-xs font-medium text-slate-400">
            Aucune photo
          </p>
        </div>
      )}
    </div>

    <div>
      <label className={labelClass}>Choisir une photo</label>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoChange}
        className="mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-sm text-slate-600 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-[#EAF3FA] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#03357A] hover:file:bg-[#DCEAF5] focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
      />

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Formats acceptés : JPG, PNG, WEBP. Taille maximale : 5 MB.
      </p>

      {photoFile && (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">
          <p>
            Fichier sélectionné :{" "}
            <span className="font-bold text-[#03357A]">
              {photoFile.name}
            </span>
          </p>
        </div>
      )}
    </div>
  </div>
</section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Contacts et adresse
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              type="text"
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+243..."
            />
          </div>

          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              type="text"
              className={inputClass}
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="+243..."
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Profession</label>
            <input
              type="text"
              className={inputClass}
              value={profession}
              onChange={(event) => setProfession(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Ville</label>
            <input
              type="text"
              className={inputClass}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Commune</label>
            <input
              type="text"
              className={inputClass}
              value={commune}
              onChange={(event) => setCommune(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Quartier</label>
            <input
              type="text"
              className={inputClass}
              value={quarter}
              onChange={(event) => setQuarter(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Adresse complète</label>
            <input
              type="text"
              className={inputClass}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Statut dans l’église
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Type de membre</label>
            <select
              className={inputClass}
              value={memberType}
              onChange={(event) => setMemberType(event.target.value)}
            >
              <option value="pasteur">Pasteur</option>
              <option value="ouvrier">Ouvrier</option>
              <option value="responsable">Responsable</option>
              <option value="membre">Membre</option>
              <option value="nouveau_converti">Nouveau converti</option>
              <option value="nouveau_accueilli">Nouveau accueilli</option>
              <option value="visiteur">Visiteur</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select
              className={inputClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="actif">Actif</option>
              <option value="nouveau">Nouveau</option>
              <option value="a_suivre">À suivre</option>
              <option value="en_suivi">En suivi</option>
              <option value="integre">Intégré</option>
              <option value="irregulier">Irrégulier</option>
              <option value="inactif">Inactif</option>
              <option value="transfere">Transféré</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Année d’intégration</label>
            <input
              type="number"
              min="1900"
              max="2100"
              className={inputClass}
              value={integrationYear}
              onChange={(event) => setIntegrationYear(event.target.value)}
              placeholder="Ex : 2026"
            />
          </div>

          <div><label className={labelClass}>Date de conversion</label><input type="date" className={inputClass} value={conversionDate} onChange={(event) => setConversionDate(event.target.value)} /></div>
          <div><label className={labelClass}>Date de baptême</label><input type="date" className={inputClass} value={baptismDate} onChange={(event) => setBaptismDate(event.target.value)} /></div>
          <div><label className={labelClass}>Date d’adhésion</label><input type="date" className={inputClass} value={membershipDate} onChange={(event) => setMembershipDate(event.target.value)} /></div>
          <div><label className={labelClass}>Étape du parcours</label><select className={inputClass} value={discipleshipStage} onChange={(event) => setDiscipleshipStage(event.target.value)}><option value="">À définir</option><option value="accueil">Accueil / découverte</option><option value="nouvelle_naissance">Nouvelle naissance</option><option value="fondements">Fondements de la foi</option><option value="bapteme">Préparation au baptême</option><option value="integration">Intégration</option><option value="service">Service actif</option><option value="leadership">Leadership</option><option value="maturite">Maturité / mentorat</option></select></div>
          <div><label className={labelClass}>Mentor / accompagnateur</label><input className={inputClass} value={mentorName} onChange={(event) => setMentorName(event.target.value)} placeholder="Responsable du suivi" /></div>
          <div><label className={labelClass}>Église précédente</label><input className={inputClass} value={previousChurch} onChange={(event) => setPreviousChurch(event.target.value)} /></div>

          <div>
            <label className={labelClass}>Département de service</label>
            <select
              className={inputClass}
              value={selectedDepartmentId}
              onChange={(event) => setSelectedDepartmentId(event.target.value)}
            >
              <option value="">Aucun département</option>
              {filteredDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            {filteredDepartments.length === 0 && (
              <p className="mt-2 text-sm text-orange-600">
                Aucun département actif n’est encore configuré pour cette église.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Statut spirituel</label>
            <input
              type="text"
              className={inputClass}
              value={spiritualStatus}
              onChange={(event) => setSpiritualStatus(event.target.value)}
              placeholder="Ex : baptisé, en formation, nouveau converti..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-100 bg-cyan-50/40 p-5">
        <div className="flex items-center gap-3"><UsersRound className="h-6 w-6 text-cyan-700" /><div><h2 className="text-lg font-extrabold text-[#03357A]">Vie de l’église</h2><p className="mt-1 text-sm text-slate-500">Groupes, talents, intérêts de service et disponibilités.</p></div></div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><label className={labelClass}>Cellule / groupe de maison</label><input className={inputClass} value={smallGroup} onChange={(event) => setSmallGroup(event.target.value)} placeholder="Nom du groupe ou de la cellule" /></div>
          <div><label className={labelClass}>Disponibilités pour servir</label><input className={inputClass} value={volunteerAvailability} onChange={(event) => setVolunteerAvailability(event.target.value)} placeholder="Dimanche matin, soirées, ponctuel…" /></div>
          <div><label className={labelClass}>Dons, talents et compétences</label><textarea rows={4} className={inputClass} value={spiritualGifts} onChange={(event) => setSpiritualGifts(event.target.value)} placeholder="Musique, enseignement, accueil, technique…" /></div>
          <div><label className={labelClass}>Ministères ou services souhaités</label><textarea rows={4} className={inputClass} value={ministryInterests} onChange={(event) => setMinistryInterests(event.target.value)} placeholder="Domaines dans lesquels le membre souhaite servir" /></div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-[#03357A]" />
          <h2 className="text-lg font-extrabold text-[#03357A]">
            Formations suivies
          </h2>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Les formations sont personnalisables par église.
        </p>

        {filteredTrainingPrograms.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredTrainingPrograms.map((training) => (
              <label
                key={training.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-bold transition ${
                  selectedTrainingIds.includes(training.id)
                    ? "border-[#03357A] bg-[#EAF3FA] text-[#03357A]"
                    : "border-[#DCEAF5] bg-white text-slate-600 hover:bg-[#F8FBFD]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTrainingIds.includes(training.id)}
                  onChange={() => toggleTraining(training.id)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {training.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#C9DBEA] bg-white p-5 text-sm text-slate-500">
            Aucune formation configurée pour cette église. Vous pouvez quand
            même compléter le champ texte ci-dessous.
          </div>
        )}

        <div className="mt-5">
          <label className={labelClass}>
            Détails complémentaires sur les formations
          </label>
          <textarea
            rows={5}
            className={inputClass}
            value={trainingNotes}
            onChange={(event) => setTrainingNotes(event.target.value)}
            placeholder="Ex : PCNC 1 terminé, PCNC 2 en cours, formation leadership prévue..."
          />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><label className={labelClass}>Prochaine étape / objectif</label><textarea rows={4} className={inputClass} value={trainingGoal} onChange={(event) => setTrainingGoal(event.target.value)} placeholder="Formation à suivre, compétence à développer, échéance…" /></div>
          <div><label className={labelClass}>Date de la dernière revue</label><input type="date" className={inputClass} value={lastTrainingReviewDate} onChange={(event) => setLastTrainingReviewDate(event.target.value)} /><p className="mt-2 text-sm text-slate-500">Permet de planifier un point régulier sur le parcours.</p></div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/members")}
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
          {isLoading ? "Enregistrement..." : "Enregistrer le membre"}
        </button>
      </div>
    </form>
  );
}
