"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserPlus } from "lucide-react";

type SuperAdminChurchUserFormProps = {
  churchId: string;
  churchName: string;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

export default function SuperAdminChurchUserForm({
  churchId,
  churchName,
}: SuperAdminChurchUserFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("12345678");
  const [role, setRole] = useState("church_admin");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const response = await fetch("/api/super-admin/church-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        churchId,
        fullName,
        email,
        password,
        role,
      }),
    });

    const result = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setErrorMessage(result.message || "Erreur lors de la création.");
      return;
    }

    setSuccessMessage("Compte utilisateur créé avec succès.");

    setTimeout(() => {
      router.push(`/super-admin/churches/${churchId}`);
      router.refresh();
    }, 900);
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
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <UserPlus className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-[#03357A]">
              Compte utilisateur de l’église
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ce compte sera lié à :{" "}
              <span className="font-bold text-[#03357A]">{churchName}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Nom complet *</label>
            <input
              className={inputClass}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ex : Pasteur Trésor Fambwami"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Email de connexion *</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pasteur@email.com"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Mot de passe temporaire *</label>
            <input
              type="text"
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              L’église pourra changer ce mot de passe plus tard.
            </p>
          </div>

          <div>
            <label className={labelClass}>Rôle *</label>
            <select
              className={inputClass}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              required
            >
              <option value="church_admin">Administrateur église</option>
              <option value="pastor">Pasteur</option>
              <option value="department_leader">Responsable département</option>
              <option value="worker">Ouvrier</option>
              <option value="member">Membre</option>
            </select>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(`/super-admin/churches/${churchId}`)}
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
          {isLoading ? "Création..." : "Créer le compte"}
        </button>
      </div>
    </form>
  );
}