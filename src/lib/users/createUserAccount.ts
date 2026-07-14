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
  user_id: string;
  church_id: string | null;
  role: string | null;
} | null;

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

async function findAuthUserByEmail(admin: any, email: string) {
  const targetEmail = cleanEmail(email);
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
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
    if (users.length < perPage) break;
  }

  return null;
}

async function readProfile(
  admin: any,
  authUserId: string
): Promise<ExistingProfile> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, user_id, church_id, role")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (error) return null;

  return data as ExistingProfile;
}

async function saveProfile(
  admin: any,
  payload: {
    user_id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    church_id: string | null;
  }
) {
  const existing = await readProfile(admin, payload.user_id);

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
        status: payload.status,
        church_id: payload.church_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", payload.user_id);

    if (error) {
      // Certains anciens schémas n'ont pas updated_at.
      const { error: fallbackError } = await admin
        .from("profiles")
        .update({
          email: payload.email,
          full_name: payload.full_name,
          role: payload.role,
          status: payload.status,
          church_id: payload.church_id,
        })
        .eq("user_id", payload.user_id);

      if (fallbackError) throw new Error(fallbackError.message);
    }
  } else {
    // IMPORTANT : profiles.id est une clé propre à la table.
    // On laisse PostgreSQL générer id et on remplit user_id avec auth.users.id.
    const { error } = await admin.from("profiles").insert({
      user_id: payload.user_id,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
      status: payload.status,
      church_id: payload.church_id,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const verified = await readProfile(admin, payload.user_id);

  if (!verified?.user_id) {
    throw new Error(
      "Le compte Auth existe, mais le profil public n’a pas été créé."
    );
  }

  return verified;
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

    const { data, error } = await admin.auth.admin.updateUserById(
      authUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          full_name: fullName,
          role,
          church_id: churchId,
          status,
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    authUser = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        church_id: churchId,
        status,
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

  try {
    await saveProfile(admin, {
      user_id: authUser.id,
      email,
      full_name: fullName,
      role,
      status,
      church_id: churchId,
    });
  } catch (error) {
    if (created) {
      await admin.auth.admin.deleteUser(authUser.id).catch(() => undefined);
    }

    throw error;
  }

  return {
    id: authUser.id,
    email,
    role,
    churchId,
    created,
  };
}
