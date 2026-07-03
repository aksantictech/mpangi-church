"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, KeyRound, RotateCcw, Save } from "lucide-react";

type SuperAdminUserActionsProps = {
  profileId: string;
  currentRole: string;
  currentStatus: string | null;
};

const roles = [
  { value: "church_admin", label: "Admin église" },
  { value: "pastor", label: "Pasteur" },
  { value: "department_leader", label: "Responsable département" },
  { value: "worker", label: "Ouvrier" },
  { value: "member", label: "Membre" },
];

export default function SuperAdminUserActions({
  profileId,
  currentRole,
  currentStatus,
}: SuperAdminUserActionsProps) {
  const router = useRouter();

  const [role, setRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const isInactive = currentStatus === "inactive";

  async function callAction(payload: Record<string, unknown>) {
    setIsLoading(true);

    const response = await fetch(`/api/super-admin/church-users/${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(result.message || "Erreur lors de l’action.");
      return;
    }

    router.refresh();
  }

  async function handleSaveRole() {
    if (role === currentRole) return;

    await callAction({
      action: "update_role",
      role,
    });
  }

  async function handleToggleStatus() {
    const nextStatus = isInactive ? "active" : "inactive";

    const confirmed = window.confirm(
      isInactive
        ? "Voulez-vous réactiver ce compte utilisateur ?"
        : "Voulez-vous vraiment désactiver ce compte utilisateur ?"
    );

    if (!confirmed) return;

    await callAction({
      action: "update_status",
      status: nextStatus,
    });
  }

  async function handleResetPassword() {
    const password = window.prompt(
      "Nouveau mot de passe temporaire :",
      "12345678"
    );

    if (!password) return;

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const confirmed = window.confirm(
      "Confirmer la réinitialisation du mot de passe ?"
    );

    if (!confirmed) return;

    await callAction({
      action: "reset_password",
      password,
    });

    alert(`Mot de passe réinitialisé : ${password}`);
  }

  if (currentRole === "super_admin") {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
        Protégé
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={role}
        onChange={(event) => setRole(event.target.value)}
        disabled={isLoading}
        className="h-10 rounded-2xl border border-[#DCEAF5] bg-white px-3 text-sm font-bold text-[#03357A] outline-none"
      >
        {roles.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleSaveRole}
        disabled={isLoading || role === currentRole}
        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 text-sm font-bold text-[#03357A] disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        Rôle
      </button>

      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={isLoading}
        className={`inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-bold ${
          isInactive
            ? "bg-green-50 text-green-700 hover:bg-green-100"
            : "bg-red-50 text-red-700 hover:bg-red-100"
        }`}
      >
        {isInactive ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <Ban className="h-4 w-4" />
        )}
        {isInactive ? "Réactiver" : "Désactiver"}
      </button>

      <button
        type="button"
        onClick={handleResetPassword}
        disabled={isLoading}
        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-orange-50 px-3 text-sm font-bold text-orange-700 hover:bg-orange-100"
      >
        <KeyRound className="h-4 w-4" />
        Mot de passe
      </button>
    </div>
  );
}