"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Eye, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import AppLogo from "@/components/brand/AppLogo";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPathByRole } from "@/lib/auth/redirect-by-role";

function getRedirectPath(role?: string | null) {
  if (role === "super_admin") return "/super-admin/dashboard";
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});

if (error || !data.user) {
  setErrorMessage(error?.message || "Identifiants incorrects.");
  setIsLoading(false);
  return;
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role, church_id, status")
  .eq("user_id", data.user.id)
  .maybeSingle();

if (profileError || !profile) {
  setErrorMessage("Profil utilisateur introuvable.");
  setIsLoading(false);
  return;
}

if (profile.status && profile.status !== "active") {
  setErrorMessage("Ce compte est désactivé. Contactez l’administrateur.");
  setIsLoading(false);
  return;
}

router.push(getDashboardPathByRole(profile.role));
router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F9FC]">
      {/* Fond global doux */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,159,199,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.12),_transparent_28%)]" />

      {/* Motifs hexagones haut gauche */}
      <div className="pointer-events-none absolute left-0 top-0 opacity-15">
        <div className="grid grid-cols-4 gap-4 p-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-10 rotate-45 rounded-md bg-[#6D9FC7]"
              style={{ opacity: Math.max(0.2, 1 - i * 0.06) }}
            />
          ))}
        </div>
      </div>

      {/* Petits points décoratifs */}
      <div className="pointer-events-none absolute left-[12%] top-[7%] hidden opacity-20 lg:block">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-[#9DBBE0]" />
          ))}
        </div>
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
       {/* PARTIE GAUCHE */}
<section className="relative hidden items-center justify-center p-8 lg:flex xl:p-10">
  <div className="relative h-[88vh] w-full max-w-[760px] overflow-hidden rounded-[3rem] border border-white/60 bg-white/45 shadow-2xl backdrop-blur-sm">
    {/* fond doux uniquement en CSS */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,159,199,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.08),_transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(248,251,253,0.75))]" />

    {/* halos décoratifs */}
    <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-[#6D9FC7]/15 blur-3xl" />
    <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#8B5CF6]/10 blur-3xl" />

    {/* hexagones haut gauche */}
    <div className="pointer-events-none absolute left-6 top-6 opacity-20">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-10 rotate-45 rounded-md bg-[#9DBBE0]"
            style={{ opacity: Math.max(0.35, 1 - i * 0.08) }}
          />
        ))}
      </div>
    </div>

    {/* petits points décoratifs */}
    <div className="pointer-events-none absolute left-44 top-10 opacity-20">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-[#B7CDE8]" />
        ))}
      </div>
    </div>

    {/* texte en haut */}
    <div className="absolute left-8 right-8 top-8 z-20">
      <div className="max-w-md rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8B5CF6]">
          Mpangi-church
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-[#03357A]">
          Chaque âme compte.
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Une plateforme simple pour accompagner, organiser et servir
          votre communauté avec foi.
        </p>
      </div>
    </div>

{/* zone image propre */}
<div className="absolute bottom-6 left-6 right-6 top-[30%] z-10">
  <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/65 shadow-inner">
    <Image
      src="/images/login-bible-church.png"
      alt="Illustration Bible et église"
      fill
      priority
      sizes="(min-width: 1024px) 42vw, 100vw"
      className="object-cover object-left-bottom"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10" />
  </div>
</div>
  </div>
</section>
        {/* PARTIE DROITE */}
        <section className="flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-2xl rounded-[2.2rem] border border-[#DCEAF5] bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur md:p-10">
            <div className="mb-8 flex justify-center">
              <AppLogo imageSize={90} />
            </div>

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#8B5CF6]" />

              <h2 className="text-3xl font-extrabold text-[#03357A] md:text-5xl">
                Connexion à votre espace{" "}
                <span className="text-[#8B5CF6]">église</span>
              </h2>

              <p className="mt-4 text-base text-slate-500 md:text-lg">
                Gérez votre église, connectez votre communauté,
                faites la différence.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[#03357A]">
                  Adresse e-mail
                </label>

                <div className="mt-2 flex items-center rounded-2xl border border-[#C9DBEA] bg-white px-4 shadow-sm focus-within:border-[#03357A] focus-within:ring-4 focus-within:ring-[#03357A]/10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FA]">
                    <Mail className="h-5 w-5 text-[#3F79B3]" />
                  </div>

                  <input
                    type="email"
                    className="w-full bg-transparent px-3 py-4 text-[#0F172A] placeholder:text-slate-400 outline-none"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#03357A]">
                  Mot de passe
                </label>

                <div className="mt-2 flex items-center rounded-2xl border border-[#C9DBEA] bg-white px-4 shadow-sm focus-within:border-[#03357A] focus-within:ring-4 focus-within:ring-[#03357A]/10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FA]">
                    <Lock className="h-5 w-5 text-[#3F79B3]" />
                  </div>

                  <input
                    type="password"
                    className="w-full bg-transparent px-3 py-4 text-[#0F172A] placeholder:text-slate-400 outline-none"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <Eye className="h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <a href="/forgot-password" className="font-medium text-[#8B5CF6]">
                  Mot de passe oublié ?
                </a>

                <label className="flex items-center gap-2 text-slate-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Se souvenir de moi
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/20 hover:from-[#022B63] hover:to-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Lock className="h-5 w-5" />
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-3 text-sm">
              <div className="h-px w-16 bg-[#DCEAF5]" />
              <span className="text-slate-500">
                by <strong className="text-[#03357A]">AKSANTIC</strong>{" "}
                <span className="text-[#8B5CF6]">Technology</span>
              </span>
              <div className="h-px w-16 bg-[#DCEAF5]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}