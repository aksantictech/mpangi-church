const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function writeFile(relativePath, content, { overwrite = true } = {}) {
  const fullPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  if (fs.existsSync(fullPath) && !overwrite) {
    console.log("Existe déjà :", relativePath);
    return;
  }

  if (fs.existsSync(fullPath)) {
    const backupPath = `${fullPath}.before-user-create-hotfix.bak`;

    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(fullPath, backupPath);
    }
  }

  fs.writeFileSync(fullPath, content, "utf8");
  console.log("Écrit :", relativePath);
}

const actions = `"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/security/access";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function upsertProfileSafely(admin: any, payload: Record<string, any>) {
  const attempts = [
    payload,
    Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== "status")
    ),
    Object.fromEntries(
      Object.entries(payload).filter(
        ([key]) => !["status", "updated_at", "created_at"].includes(key)
      )
    ),
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    const { error } = await admin
      .from("profiles")
      .upsert(attempt, { onConflict: "id" });

    if (!error) return;

    lastError = error;
  }

  throw new Error(lastError?.message || "Impossible de créer le profil.");
}

export async function createSuperAdminUserAction(formData: FormData) {
  await requireSuperAdmin();

  const fullName = readString(formData, "full_name");
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const role = readString(formData, "role") || "worker";
  const churchId = readString(formData, "church_id");

  if (!fullName) throw new Error("Le nom complet est obligatoire.");
  if (!email) throw new Error("L’email est obligatoire.");
  if (!password || password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error("Utilisateur créé sans identifiant.");
  }

  const now = new Date().toISOString();

  await upsertProfileSafely(admin, {
    id: userId,
    email,
    full_name: fullName,
    role,
    status: "active",
    church_id: churchId || null,
    created_at: now,
    updated_at: now,
  });

  redirect("/super-admin/settings?createdUser=1");
}
`;

const page = `import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/security/access";
import { createSuperAdminUserAction } from "./actions";

const ROLE_OPTIONS = [
  { value: "church_admin", label: "Admin Église" },
  { value: "pasteur_t", label: "Pasteur T" },
  { value: "pasteur_a", label: "Pasteur A" },
  { value: "charge_afp", label: "Chargé AFP" },
  { value: "responsable_d", label: "Responsable D" },
  { value: "logisticien", label: "Logisticien" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "worker", label: "Ouvrier / utilisateur" },
  { value: "readonly", label: "Lecture seule" },
];

async function getChurches() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("churches")
    .select("id, name, slug, status")
    .order("name", { ascending: true });

  if (error) return [];

  return data ?? [];
}

export default async function NewSuperAdminUserPage() {
  await requireSuperAdmin();

  const churches = await getChurches();

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour paramètres
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <UserPlus className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
                Super Admin
              </p>
              <h1 className="mt-2 text-3xl font-black">
                Créer un utilisateur
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Créez un compte lié à une église et attribuez directement son rôle.
              </p>
            </div>
          </div>
        </section>

        <form
          action={createSuperAdminUserAction}
          className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Nom complet
              </span>
              <input
                name="full_name"
                required
                placeholder="Ex. Pasteur Trésor Fambwami"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="email@eglise.org"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Mot de passe temporaire
              </span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Rôle
              </span>
              <select
                name="role"
                defaultValue="worker"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-black text-[#03357A]">
                Église liée
              </span>
              <select
                name="church_id"
                required
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                <option value="">Sélectionner une église</option>
                {churches.map((church: any) => (
                  <option key={church.id} value={church.id}>
                    {church.name} /{church.slug}
                    {church.status ? " — " + church.status : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/super-admin/settings"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-black text-[#03357A]"
            >
              Annuler
            </Link>

            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
            >
              Créer l’utilisateur
            </button>
          </div>
        </form>
      </div>
    </SuperAdminShell>
  );
}
`;

const redirectToNew = `import { redirect } from "next/navigation";

export default function RedirectToNewUserPage() {
  redirect("/super-admin/users/new");
}
`;

const redirectToSettings = `import { redirect } from "next/navigation";

export default function RedirectToSuperAdminSettingsPage() {
  redirect("/super-admin/settings");
}
`;

writeFile("src/app/super-admin/users/new/actions.ts", actions);
writeFile("src/app/super-admin/users/new/page.tsx", page);
writeFile("src/app/super-admin/users/news/page.tsx", redirectToNew);
writeFile("src/app/super-admin/settings/users/new/page.tsx", redirectToNew);
writeFile("src/app/super-admin/settings/users/news/page.tsx", redirectToNew);
writeFile("src/app/super-admin/users/page.tsx", redirectToSettings);

console.log("");
console.log("Routes création utilisateur Super Admin stabilisées.");
console.log("Tester : /super-admin/users/new");
console.log("Alias : /super-admin/users/news et /super-admin/settings/users/new");
