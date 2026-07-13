import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole } from "@/lib/users/userRoles";

type CreateUserAccountInput = {
  email: string;
  password: string;
  fullName: string;
  role: string;
  churchId: string | null;
  status?: string;
  updateExisting?: boolean;
};

type ExistingProfile = {
  id: string;
  church_id: string | null;
  role: string | null;
} | null;

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findAuthUserByEmail(admin: any, email: string) {
  const target = cleanEmail(email);
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data?.users || [];
    const match = users.find(
      (user: any) => cleanEmail(user.email || "") === target
    );

    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

async function readProfile(
  admin: any,
  userId: string
): Promise<ExistingProfile> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, church_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;

  return data as ExistingProfile;
}

async function upsertProfileSafely(admin: any, payload: Record<string, any>) {
  const attempts = [
    payload,
    Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== "status")
    ),
    Object.fromEntries(
      Object.entries(payload).filter(
        ([key]) => !["status", "created_at", "updated_at"].includes(key)
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

  throw new Error(
    lastError?.message || "Impossible d’enregistrer le profil utilisateur."
  );
}

export async function createOrUpdateUserAccount(
  input: CreateUserAccountInput
) {
  const admin = createAdminClient();

  const email = cleanEmail(input.email);
  const fullName = input.fullName.trim();
  const password = input.password.trim();
  const role = normalizeUserRole(input.role);
  const churchId = input.churchId || null;
  const status = input.status || "active";
  const updateExisting = input.updateExisting ?? true;

  if (!fullName) {
    throw new Error("Le nom complet est obligatoire.");
  }

  if (!email) {
    throw new Error("L’adresse email est obligatoire.");
  }

  if (password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }

  let authUser = await findAuthUserByEmail(admin, email);
  let created = false;

  if (authUser) {
    if (!updateExisting) {
      throw new Error(
        "Cet email existe déjà. Ouvrez Utilisateurs & rôles pour modifier le compte."
      );
    }

    const existingProfile = await readProfile(admin, authUser.id);
    const existingChurchId = existingProfile?.church_id || null;

    if (existingChurchId && churchId && existingChurchId !== churchId) {
      throw new Error(
        "Cet email existe déjà et il est rattaché à une autre église."
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      authUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
        },
      }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
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

    authUser = data.user;
    created = true;
  }

  if (!authUser?.id) {
    throw new Error("Identifiant utilisateur introuvable après création.");
  }

  const now = new Date().toISOString();

  await upsertProfileSafely(admin, {
    id: authUser.id,
    email,
    full_name: fullName,
    role,
    status,
    church_id: churchId,
    created_at: now,
    updated_at: now,
  });

  return {
    id: authUser.id,
    email,
    role,
    created,
  };
}
