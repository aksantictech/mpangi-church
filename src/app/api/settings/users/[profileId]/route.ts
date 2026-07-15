import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    profileId: string;
  }>;
};

type UpdatePayload = {
  action:
    | "update_profile"
    | "update_status"
    | "archive"
    | "reset_password";
  fullName?: string;
  email?: string;
  role?: string;
  status?: "active" | "inactive";
  password?: string;
};

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "admin_eglise",
  "owner",
  "pasteur",
  "pasteur_t",
  "pastor",
]);

const ALLOWED_USER_ROLES = new Set([
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
  "pasteur_a",
  "charge_afp",
  "department_leader",
  "responsable_d",
  "logisticien",
  "secretaire",
  "worker",
  "readonly",
  "member",
]);

const ACTIVE_STATUSES = ["active", "actif"];

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getChurchAdminContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Session expirée." },
        { status: 401 }
      ),
    };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, user_id, role, status, church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !profile.church_id ||
    !ADMIN_ROLES.has(String(profile.role).toLowerCase()) ||
    !ACTIVE_STATUSES.includes(String(profile.status || "active"))
  ) {
    return {
      error: NextResponse.json(
        { message: "Accès refusé." },
        { status: 403 }
      ),
    };
  }

  return {
    admin,
    user,
    profile,
  };
}

async function getTargetProfile(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  churchId: string
) {
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, user_id, church_id, full_name, email, role, status"
    )
    .eq("id", profileId)
    .eq("church_id", churchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function ensureNotLastAdministrator({
  admin,
  target,
  nextRole,
  nextStatus,
}: {
  admin: ReturnType<typeof createAdminClient>;
  target: any;
  nextRole?: string;
  nextStatus?: string;
}) {
  const targetIsAdministrator = ADMIN_ROLES.has(
    String(target.role || "").toLowerCase()
  );

  const targetIsActive = ACTIVE_STATUSES.includes(
    String(target.status || "active")
  );

  const removesAdminAccess =
    targetIsAdministrator &&
    targetIsActive &&
    (
      (nextRole &&
        !ADMIN_ROLES.has(String(nextRole).toLowerCase())) ||
      (nextStatus &&
        !ACTIVE_STATUSES.includes(String(nextStatus)))
    );

  if (!removesAdminAccess) {
    return;
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, role, status")
    .eq("church_id", target.church_id);

  if (error) {
    throw new Error(error.message);
  }

  const activeAdministrators = (profiles || []).filter(
    (item: any) =>
      ADMIN_ROLES.has(
        String(item.role || "").toLowerCase()
      ) &&
      ACTIVE_STATUSES.includes(
        String(item.status || "active")
      )
  );

  if (activeAdministrators.length <= 1) {
    throw new Error(
      "Impossible de retirer le dernier administrateur actif de cette église."
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const context = await getChurchAdminContext();

    if ("error" in context) {
      return context.error;
    }

    const { profileId } = await params;
    const payload = (await request.json()) as UpdatePayload;

    const target = await getTargetProfile(
      context.admin,
      profileId,
      String(context.profile.church_id)
    );

    if (!target) {
      return NextResponse.json(
        { message: "Utilisateur introuvable dans cette église." },
        { status: 404 }
      );
    }

    if (String(target.role) === "super_admin") {
      return NextResponse.json(
        { message: "Un compte Super Admin est protégé." },
        { status: 403 }
      );
    }

    const isSelf = target.id === context.profile.id;

    if (payload.action === "update_profile") {
      const fullName = cleanText(payload.fullName, 160);
      const email = cleanText(payload.email, 254).toLowerCase();
      const role = cleanText(payload.role || target.role, 80);

      if (!fullName) {
        return NextResponse.json(
          { message: "Le nom complet est obligatoire." },
          { status: 400 }
        );
      }

      if (!email || !isValidEmail(email)) {
        return NextResponse.json(
          { message: "L’adresse email est invalide." },
          { status: 400 }
        );
      }

      if (!ALLOWED_USER_ROLES.has(role)) {
        return NextResponse.json(
          { message: "Le rôle sélectionné n’est pas autorisé." },
          { status: 400 }
        );
      }

      if (isSelf && role !== String(target.role)) {
        return NextResponse.json(
          {
            message:
              "Vous ne pouvez pas modifier votre propre rôle depuis cette page.",
          },
          { status: 400 }
        );
      }

      await ensureNotLastAdministrator({
        admin: context.admin,
        target,
        nextRole: role,
      });

      if (target.user_id) {
        const { data: authUser } =
          await context.admin.auth.admin.getUserById(
            target.user_id
          );

        const { error: authError } =
          await context.admin.auth.admin.updateUserById(
            target.user_id,
            {
              email,
              user_metadata: {
                ...(authUser?.user?.user_metadata || {}),
                full_name: fullName,
                role,
                church_id: target.church_id,
              },
            }
          );

        if (authError) {
          return NextResponse.json(
            { message: authError.message },
            { status: 400 }
          );
        }
      }

      const { error } = await context.admin
        .from("profiles")
        .update({
          full_name: fullName,
          email,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", target.id)
        .eq("church_id", target.church_id);

      if (error) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Informations utilisateur mises à jour.",
      });
    }

    if (payload.action === "update_status") {
      if (isSelf) {
        return NextResponse.json(
          {
            message:
              "Vous ne pouvez pas désactiver ou réactiver votre propre compte.",
          },
          { status: 400 }
        );
      }

      const status =
        payload.status === "active"
          ? "active"
          : "inactive";

      await ensureNotLastAdministrator({
        admin: context.admin,
        target,
        nextStatus: status,
      });

      const { error } = await context.admin
        .from("profiles")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", target.id)
        .eq("church_id", target.church_id);

      if (error) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }

      if (target.user_id) {
        const { data: authUser } =
          await context.admin.auth.admin.getUserById(
            target.user_id
          );

        await context.admin.auth.admin.updateUserById(
          target.user_id,
          {
            user_metadata: {
              ...(authUser?.user?.user_metadata || {}),
              status,
            },
          }
        );
      }

      return NextResponse.json({
        message:
          status === "active"
            ? "Compte réactivé."
            : "Compte désactivé.",
      });
    }

    if (payload.action === "archive") {
      if (isSelf) {
        return NextResponse.json(
          {
            message:
              "Vous ne pouvez pas archiver votre propre compte.",
          },
          { status: 400 }
        );
      }

      await ensureNotLastAdministrator({
        admin: context.admin,
        target,
        nextStatus: "archived",
      });

      const { error } = await context.admin
        .from("profiles")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("id", target.id)
        .eq("church_id", target.church_id);

      if (error) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }

      if (target.user_id) {
        const { data: authUser } =
          await context.admin.auth.admin.getUserById(
            target.user_id
          );

        await context.admin.auth.admin.updateUserById(
          target.user_id,
          {
            user_metadata: {
              ...(authUser?.user?.user_metadata || {}),
              status: "archived",
            },
          }
        );
      }

      return NextResponse.json({
        message: "Compte archivé.",
      });
    }

    if (payload.action === "reset_password") {
      const password = String(payload.password || "");

      if (!target.user_id) {
        return NextResponse.json(
          {
            message:
              "Ce profil n’est lié à aucun compte de connexion.",
          },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          {
            message:
              "Le mot de passe doit contenir au moins 8 caractères.",
          },
          { status: 400 }
        );
      }

      const { error } =
        await context.admin.auth.admin.updateUserById(
          target.user_id,
          {
            password,
          }
        );

      if (error) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Mot de passe temporaire enregistré.",
      });
    }

    return NextResponse.json(
      { message: "Action inconnue." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message:
          error?.message ||
          "Une erreur a empêché la modification du compte.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteProps
) {
  try {
    const context = await getChurchAdminContext();

    if ("error" in context) {
      return context.error;
    }

    const { profileId } = await params;

    const target = await getTargetProfile(
      context.admin,
      profileId,
      String(context.profile.church_id)
    );

    if (!target) {
      return NextResponse.json(
        { message: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    if (target.id === context.profile.id) {
      return NextResponse.json(
        {
          message:
            "Vous ne pouvez pas supprimer votre propre compte.",
        },
        { status: 400 }
      );
    }

    if (
      String(target.role) === "super_admin"
    ) {
      return NextResponse.json(
        { message: "Le compte Super Admin est protégé." },
        { status: 403 }
      );
    }

    await ensureNotLastAdministrator({
      admin: context.admin,
      target,
      nextStatus: "deleted",
    });

    if (target.user_id) {
      const { error: authError } =
        await context.admin.auth.admin.deleteUser(
          target.user_id
        );

      if (authError) {
        return NextResponse.json(
          { message: authError.message },
          { status: 400 }
        );
      }
    }

    await context.admin
      .from("profile_module_permissions")
      .delete()
      .eq("profile_id", target.id)
      .eq("church_id", target.church_id);

    const { error: profileError } =
      await context.admin
        .from("profiles")
        .delete()
        .eq("id", target.id)
        .eq("church_id", target.church_id);

    if (profileError) {
      return NextResponse.json(
        { message: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Utilisateur supprimé définitivement.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message:
          error?.message ||
          "Une erreur a empêché la suppression.",
      },
      { status: 500 }
    );
  }
}
