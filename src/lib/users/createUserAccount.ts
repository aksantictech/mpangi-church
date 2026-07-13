import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole } from "@/lib/users/userRoles";

type CreateUserAccountInput = {
  email: string;
  password: string;
  fullName: string;
  role: string;
  churchId: string | null;
  status?: string;
  allowExistingInSameChurch?: boolean;
  allowExistingWithoutChurch?: boolean;
};

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findAuthUserByEmail(admin: any, email: string) {
  const targetEmail = cleanEmail(email);
  let page = 1;
  const perPage = 1000;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data?.users ?? [];
    const found = users.find(
      (user: any) => cleanEmail(user.email || "") === targetEmail
    );

    if (found) return found;

    if (users.length < perPage) return null;

    page += 1;
  }

  return null;
}

async function getExistingProfile(admin: any, userId: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, church_id, status")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;

  return data;
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

  throw new Error(lastError?.message || "Impossible de créer le profil.");
}

export async function createOrUpdateUserAccount(input: CreateUserAccountInput) {
  const admin = createAdminClient();

  const email = cleanEmail(input.email);
  const fullName = input.fullName.trim();
  const password = input.password.trim();
  const role = normalizeUserRole(input.role);
  const churchId = input.churchId || null;
  const status = input.status || "active";

  if (!fullName) throw new Error("Le nom complet est obligatoire.");
  if (!email) throw new Error("L’email est obligatoire.");
  if (!password || password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }

  let authUser = await findAuthUserByEmail(admin, email);
  let created = false;

  if (authUser) {
    const existingProfile = await getExistingProfile(admin, authUser.id);

    const existingChurchId = existingProfile?.church_id || null;

    if (
      existingChurchId &&
      churchId &&
      existingChurchId !== churchId &&
      !input.allowExistingWithoutChurch
    ) {
      throw new Error(
        "Cet email existe déjà et il est rattaché à une autre église."
      );
    }

    if (
      existingChurchId &&
      churchId &&
      existingChurchId === churchId &&
      !input.allowExistingInSameChurch
    ) {
      throw new Error(
        "Cet email existe déjà dans cette église. Ouvrez Utilisateurs & rôles pour modifier son rôle."
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
      if (error.message?.toLowerCase().includes("already")) {
        throw new Error(
          "Cet email existe déjà. Relancez la création ou modifiez le compte existant dans Utilisateurs & rôles."
        );
      }

      throw new Error(error.message);
    }

    authUser = data.user;
    created = true;
  }

  if (!authUser?.id) {
    throw new Error("Utilisateur introuvable après création.");
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
