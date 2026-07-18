"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { USER_ROLE_OPTIONS } from "@/lib/users/userRoles";
import {
  Ban,
  Eye,
  KeyRound,
  Pencil,
  RotateCcw,
  Save,
} from "lucide-react";

type SuperAdminUserActionsProps = {
  profileId: string;
  currentRole: string;
  currentStatus: string | null;
  showNavigation?: boolean;
};

type ActionResponse = {
  message?: string;
};

type RoleOption = {
  value: string;
  label: string;
};

const editableRoles: RoleOption[] =
  USER_ROLE_OPTIONS
    .map((option) => ({
      value: String(option.value),
      label: option.label,
    }))
    .filter(
      (option) =>
        option.value !== "super_admin"
    );

export default function SuperAdminUserActions({
  profileId,
  currentRole,
  currentStatus,
  showNavigation = true,
}: SuperAdminUserActionsProps) {
  const router = useRouter();

  const [role, setRole] = useState(currentRole);
  const [isLoading, setIsLoading] =
    useState(false);

  const isInactive = currentStatus === "inactive";

  const roleOptions: RoleOption[] =
  editableRoles.some(
    (item) =>
      item.value === currentRole
  )
    ? editableRoles
    : [
        {
          value: currentRole,
          label: currentRole,
        },
        ...editableRoles,
      ];

  async function callAction(
    payload: Record<string, unknown>
  ) {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/super-admin/church-users/${profileId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result =
        (await response.json().catch(() => ({}))) as
          ActionResponse;

      if (!response.ok) {
        window.alert(
          result.message ||
            "Erreur lors de l’action."
        );

        return false;
      }

      router.refresh();
      return true;
    } catch {
      window.alert(
        "Impossible de contacter le serveur."
      );

      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveRole() {
    if (role === currentRole) return;

    await callAction({
      action: "update_role",
      role,
    });
  }

  async function handleToggleStatus() {
    const nextStatus = isInactive
      ? "active"
      : "inactive";

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
      window.alert(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    const confirmed = window.confirm(
      "Confirmer la réinitialisation du mot de passe ?"
    );

    if (!confirmed) return;

    const success = await callAction({
      action: "reset_password",
      password,
    });

    if (success) {
      window.alert(
        `Mot de passe réinitialisé : ${password}`
      );
    }
  }

  if (currentRole === "super_admin") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {showNavigation && (
          <Link
            href={`/super-admin/users/${profileId}`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 text-sm font-bold text-[#03357A]"
          >
            <Eye className="h-4 w-4" />
            Voir
          </Link>
        )}

        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
          Compte protégé
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showNavigation && (
        <>
          <Link
            href={`/super-admin/users/${profileId}`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 text-sm font-bold text-[#03357A] hover:bg-blue-100"
          >
            <Eye className="h-4 w-4" />
            Voir
          </Link>

          <Link
            href={`/super-admin/users/${profileId}/edit`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-violet-50 px-3 text-sm font-bold text-violet-700 hover:bg-violet-100"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </>
      )}

      <select
        value={role}
        onChange={(event) =>
          setRole(event.target.value)
        }
        disabled={isLoading}
        className="h-10 rounded-2xl border border-[#DCEAF5] bg-white px-3 text-sm font-bold text-[#03357A] outline-none"
      >
      {roleOptions.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleSaveRole}
        disabled={
          isLoading || role === currentRole
        }
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

        {isInactive
          ? "Réactiver"
          : "Désactiver"}
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