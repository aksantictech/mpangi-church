"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, KeyRound, Save } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function SuperAdminPasswordPage() {
  const supabase = createSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmation) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setPassword("");
    setConfirmation("");
    setMessage("Mot de passe modifié avec succès.");
  }

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/super-admin/profile"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au profil
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <KeyRound className="h-10 w-10" />
          <h1 className="mt-4 text-3xl font-black">
            Modifier le mot de passe
          </h1>
          <p className="mt-2 text-sm leading-7 text-blue-50">
            Choisissez un mot de passe sécurisé pour votre compte.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"
        >
          <label className="block space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Nouveau mot de passe
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Confirmer le mot de passe
            </span>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              required
            />
          </label>

          {errorMessage && (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </SuperAdminShell>
  );
}
