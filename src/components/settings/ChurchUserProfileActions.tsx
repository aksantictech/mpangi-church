"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Ban,
  KeyRound,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  UserCog,
} from "lucide-react";

type UserProfile = {
  id: string;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
};

type Props = {
  profile: UserProfile;
  currentProfileId: string;
};

const ROLE_OPTIONS = [
  { value: "church_admin", label: "Administrateur église" },
  { value: "pasteur_t", label: "Pasteur titulaire" },
  { value: "pastor", label: "Pasteur" },
  { value: "pasteur_a", label: "Pasteur assistant" },
  { value: "charge_afp", label: "Chargé AFP" },
  { value: "department_leader", label: "Responsable département" },
  { value: "responsable_d", label: "Responsable département" },
  { value: "logisticien", label: "Logisticien" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "worker", label: "Ouvrier" },
  { value: "readonly", label: "Lecture seule" },
  { value: "member", label: "Membre" },
];

function normalizeStatus(value: string | null) {
  if (value === "actif") return "active";
  if (value === "inactif") return "inactive";
  return value || "active";
}

export default function ChurchUserProfileActions({
  profile,
  currentProfileId,
}: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.fullName || "");
  const [email, setEmail] = useState(profile.email || "");
  const [role, setRole] = useState(profile.role || "worker");
  const [status, setStatus] = useState(normalizeStatus(profile.status));

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isSelf = profile.id === currentProfileId;
  const isArchived = status === "archived";
  const isInactive = status === "inactive";

  const roleOptions = useMemo(() => {
    if (
      role &&
      !ROLE_OPTIONS.some((item) => item.value === role)
    ) {
      return [
        { value: role, label: role },
        ...ROLE_OPTIONS,
      ];
    }

    return ROLE_OPTIONS;
  }, [role]);

  async function callAction(
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/settings/users/${profile.id}`,
        {
          method: payload.action === "delete" ? "DELETE" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body:
            payload.action === "delete"
              ? undefined
              : JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Action impossible."
        );
      }

      setMessage(result?.message || successMessage);

      if (payload.action === "delete") {
        router.push("/settings/users?deleted=1");
      } else {
        router.refresh();
      }
    } catch (actionError: any) {
      setError(
        actionError?.message || "Une erreur est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveProfile() {
    if (!fullName.trim()) {
      setError("Le nom complet est obligatoire.");
      return;
    }

    if (!email.trim()) {
      setError("L’adresse email est obligatoire.");
      return;
    }

    await callAction(
      {
        action: "update_profile",
        fullName,
        email,
        role,
      },
      "Informations mises à jour."
    );

    setIsEditing(false);
  }

  async function toggleStatus() {
    const nextStatus =
      isInactive || isArchived
        ? "active"
        : "inactive";

    const confirmed = window.confirm(
      nextStatus === "active"
        ? "Réactiver ce compte utilisateur ?"
        : "Désactiver temporairement ce compte ?"
    );

    if (!confirmed) return;

    await callAction(
      {
        action: "update_status",
        status: nextStatus,
      },
      nextStatus === "active"
        ? "Compte réactivé."
        : "Compte désactivé."
    );

    setStatus(nextStatus);
  }

  async function archiveProfile() {
    const confirmed = window.confirm(
      "Archiver ce compte ? Il sera conservé dans l’historique, mais ne pourra plus se connecter."
    );

    if (!confirmed) return;

    await callAction(
      {
        action: "archive",
      },
      "Compte archivé."
    );

    setStatus("archived");
  }

  async function resetPassword() {
    const password = window.prompt(
      "Saisissez un mot de passe temporaire d’au moins 8 caractères :"
    );

    if (!password) return;

    if (password.length < 8) {
      setError(
        "Le mot de passe temporaire doit contenir au moins 8 caractères."
      );
      return;
    }

    await callAction(
      {
        action: "reset_password",
        password,
      },
      "Mot de passe réinitialisé."
    );
  }

  async function deleteProfile() {
    const confirmation = window.prompt(
      "Suppression définitive. Tapez SUPPRIMER pour confirmer :"
    );

    if (confirmation !== "SUPPRIMER") {
      return;
    }

    await callAction(
      {
        action: "delete",
      },
      "Utilisateur supprimé."
    );
  }

  return (
    <section className="mt-5 rounded-3xl border border-[#C9DBEA] bg-[#F8FBFD] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[#03357A]" />
            <h3 className="font-black text-[#03357A]">
              Gestion du compte
            </h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Modifiez les informations, le rôle et l’état du compte.
            L’archivage est recommandé avant une suppression définitive.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing((value) => !value)}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#03357A] ring-1 ring-[#C9DBEA]"
        >
          <Pencil className="h-4 w-4" />
          {isEditing ? "Fermer" : "Modifier"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {isEditing && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Nom complet
            </span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mpangi-form-control"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Adresse email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mpangi-form-control"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-black text-[#03357A]">
              Rôle
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              disabled={isSelf}
              className="mpangi-form-control"
            >
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {isSelf && (
              <span className="block text-xs font-semibold text-amber-700">
                Vous ne pouvez pas modifier votre propre rôle depuis cette page.
              </span>
            )}
          </label>

          <button
            type="button"
            onClick={saveProfile}
            disabled={isLoading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-50 md:col-span-2"
          >
            <Save className="h-4 w-4" />
            Enregistrer les informations
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={toggleStatus}
          disabled={isLoading || isSelf}
          className={[
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45",
            isInactive || isArchived
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {isInactive || isArchived ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          {isInactive || isArchived ? "Réactiver" : "Désactiver"}
        </button>

        <button
          type="button"
          onClick={archiveProfile}
          disabled={isLoading || isSelf || isArchived}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 disabled:opacity-45"
        >
          <Archive className="h-4 w-4" />
          Archiver
        </button>

        <button
          type="button"
          onClick={resetPassword}
          disabled={isLoading || !profile.userId}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-black text-orange-700 disabled:opacity-45"
        >
          <KeyRound className="h-4 w-4" />
          Mot de passe
        </button>

        <button
          type="button"
          onClick={deleteProfile}
          disabled={isLoading || isSelf || !profile.userId}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-black text-red-700 disabled:opacity-45"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>

      {isSelf && (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Votre propre compte ne peut pas être désactivé, archivé ou supprimé.
        </p>
      )}
    </section>
  );
}
