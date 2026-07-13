"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeSuperAdminAssignableRole } from "@/lib/roles";

function text(value: FormDataEntryValue | null) {
  return value === null || value === undefined ? "" : String(value).trim();
}

async function requireSuperAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (profile.status && profile.status !== "active") redirect("/login");

  if (profile.role !== "super_admin") redirect("/dashboard");

  return profile;
}

export async function createSuperAdminUserAction(formData: FormData) {
  await requireSuperAdminProfile();
  const admin = createAdminClient();

  const fullName = text(formData.get("full_name"));
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));
  const role = normalizeSuperAdminAssignableRole(formData.get("role"));
  const status = text(formData.get("status")) || "active";
  const churchId = role === "super_admin" ? null : text(formData.get("church_id")) || null;

  if (!fullName || !email || !password || password.length < 6) {
    redirect("/super-admin/users/new?error=required");
  }

  if (role !== "super_admin" && !churchId) {
    redirect("/super-admin/users/new?error=church");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      church_id: churchId,
    },
  });

  if (authError || !authData.user) {
    const code = encodeURIComponent(authError?.message || "create");
    redirect(`/super-admin/users/new?error=${code}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      user_id: authData.user.id,
      full_name: fullName,
      email,
      role,
      status,
      church_id: churchId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (profileError) {
    redirect(`/super-admin/users/new?error=${encodeURIComponent(profileError.message)}`);
  }

  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/settings");
  revalidatePath("/settings/users");

  redirect("/super-admin/users?created=1");
}
