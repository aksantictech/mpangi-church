"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Send,
  UserCircle,
  Users,
} from "lucide-react";

type DepartmentOption = {
  id: string;
  name: string;
};

type TrainingProgramOption = {
  id: string;
  name: string;
};

type PublicMemberRegistrationFormProps = {
  churchSlug: string;
  token: string;
  departments: DepartmentOption[];
  trainingPrograms: TrainingProgramOption[];
};

const inputClass =
  "h-13 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const textareaClass =
  "min-h-32 w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };

    reader.onerror = () => {
      reject(new Error("Impossible de lire la photo."));
    };

    reader.readAsDataURL(file);
  });
}

export default function PublicMemberRegistrationForm({
  churchSlug,
  token,
  departments,
  trainingPrograms,
}: PublicMemberRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const hasDepartments = departments.length > 0;
  const hasTrainingPrograms = trainingPrograms.length > 0;

  const maxPhotoSizeMb = useMemo(() => 5 * 1024 * 1024, []);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setErrorMessage("");

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Format photo non accepté. Utilisez JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > maxPhotoSizeMb) {
      setErrorMessage("La photo ne doit pas dépasser 5 MB.");
      event.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const formElement = event.currentTarget;
  const form = new FormData(formElement);

  setIsLoading(true);
  setSuccessMessage("");
  setErrorMessage("");

  const departmentIds = form.getAll("departmentIds").map(String);
  const trainingProgramIds = form.getAll("trainingProgramIds").map(String);

  let photoBase64 = "";
  let photoName = "";
  let photoType = "";

  try {
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
      photoName = photoFile.name;
      photoType = photoFile.type;
    }

    const response = await fetch("/api/public/member-registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        churchSlug,
        token,

        firstName: form.get("firstName"),
        middleName: form.get("middleName"),
        lastName: form.get("lastName"),
        gender: form.get("gender"),
        birthDate: form.get("birthDate"),
        maritalStatus: form.get("maritalStatus"),

        phone: form.get("phone"),
        email: form.get("email"),
        address: form.get("address"),

        integrationYear: form.get("integrationYear"),
        baptismDate: form.get("baptismDate"),
        occupation: form.get("occupation"),
        emergencyContact: form.get("emergencyContact"),

        departmentIds,
        trainingProgramIds,

        notes: form.get("notes"),

        photoBase64,
        photoName,
        photoType,
      }),
    });

    const payload = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setErrorMessage(payload.error || "Erreur pendant l’envoi.");
      return;
    }

    formElement.reset();
    setPhotoFile(null);
    setPhotoPreview("");
    setSuccessMessage("Votre fiche membre a été envoyée avec succès.");
  } catch (error) {
    setIsLoading(false);

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Erreur inattendue pendant l’envoi."
    );
  }
}

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <Section title="Identité du membre" icon={<UserCircle className="h-6 w-6" />}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Prénom *">
            <input name="firstName" required className={inputClass} />
          </Field>

          <Field label="Nom *">
            <input name="lastName" required className={inputClass} />
          </Field>

          <Field label="Post-nom">
            <input name="middleName" className={inputClass} />
          </Field>

          <Field label="Sexe">
            <select name="gender" className={inputClass} defaultValue="">
              <option value="">Non renseigné</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </Field>

          <Field label="Date de naissance">
            <input name="birthDate" type="date" className={inputClass} />
          </Field>

          <Field label="État civil">
            <select name="maritalStatus" className={inputClass} defaultValue="">
              <option value="">Non renseigné</option>
              <option value="celibataire">Célibataire</option>
              <option value="marie">Marié(e)</option>
              <option value="veuf">Veuf / Veuve</option>
              <option value="divorce">Divorcé(e)</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Photo du membre" icon={<Camera className="h-6 w-6" />}>
        <div className="grid gap-5 md:grid-cols-[0.35fr_0.65fr] md:items-center">
          <div className="flex h-44 items-center justify-center overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Aperçu photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-400">
                <Camera className="mx-auto h-10 w-10" />
                <p className="mt-2 text-sm">Aucune photo</p>
              </div>
            )}
          </div>

          <div>
            <Field label="Choisir une photo">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className={inputClass}
              />
            </Field>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Formats acceptés : JPG, PNG, WEBP. Taille maximale : 5 MB.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Contact et localisation" icon={<Users className="h-6 w-6" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Téléphone / WhatsApp">
            <input name="phone" className={inputClass} />
          </Field>

          <Field label="Email">
            <input name="email" type="email" className={inputClass} />
          </Field>

          <div className="md:col-span-2">
            <Field label="Adresse">
              <input name="address" className={inputClass} />
            </Field>
          </div>

          <Field label="Profession">
            <input name="occupation" className={inputClass} />
          </Field>

          <Field label="Contact d’urgence">
            <input name="emergencyContact" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section
        title="Vie dans l’église"
        icon={<Users className="h-6 w-6" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Année d’intégration">
            <input
              name="integrationYear"
              type="number"
              min="1900"
              max="2100"
              className={inputClass}
              placeholder="Exemple : 2024"
            />
          </Field>

          <Field label="Date de baptême">
            <input name="baptismDate" type="date" className={inputClass} />
          </Field>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-bold text-[#03357A]">
            Département(s) de service
          </p>

          {hasDepartments ? (
            <div className="grid gap-3 md:grid-cols-2">
              {departments.map((department) => (
                <label
                  key={department.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    name="departmentIds"
                    value={department.id}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {department.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
              Aucun département disponible pour le moment.
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Formations suivies"
        icon={<GraduationCap className="h-6 w-6" />}
      >
        {hasTrainingPrograms ? (
          <div className="grid gap-3 md:grid-cols-2">
            {trainingPrograms.map((program) => (
              <label
                key={program.id}
                className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm font-semibold text-slate-700"
              >
                <input
                  type="checkbox"
                  name="trainingProgramIds"
                  value={program.id}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {program.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
            Aucune formation configurée pour le moment.
          </p>
        )}
      </Section>

      <Section title="Informations complémentaires" icon={<Users className="h-6 w-6" />}>
        <Field label="Notes / remarques">
          <textarea
            name="notes"
            className={textareaClass}
            placeholder="Disponibilités, ministère, remarques, besoins d’accompagnement..."
          />
        </Field>
      </Section>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}

        {isLoading ? "Envoi..." : "Envoyer ma fiche membre"}
      </button>
    </form>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          {icon}
        </div>

        <h2 className="text-xl font-extrabold text-[#03357A]">{title}</h2>
      </div>

      {children}
    </section>
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