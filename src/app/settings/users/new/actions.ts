"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  CHURCH_ADMIN_ROLES,
  PASTOR_ROLES,
  normalizeChurchRole,
} from "@/lib/roles";

function text(value: FormDataEntryValue | null) {
  return value === null || value === undefined ? "" : String(value).trim();
}

async function requireChurchAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (profile.status && profile.status !== "active") redirect("/login");

  const role = String(profile.role || "").toLowerCase();

  if (!profile.church_id || (!CHURCH_ADMIN_ROLES.has(role) && !PASTOR_ROLES.has(role))) {
    redirect("/dashboard");
  }

  return profile;
}

export async function createChurchUserAction(formData: FormData) {
  const currentProfile = await requireChurchAdminProfile();
  const admin = createAdminClient();

  const fullName = text(formData.get("full_name"));
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));
  const role = normalizeChurchRole(formData.get("role"));
  const status = text(formData.get("status")) || "active";

  if (!fullName || !email || !password || password.length < 6) {
    redirect("/settings/users/new?error=required");
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      church_id: currentProfile.church_id,
    },
  });

  if (authError || !authData.user) {
    const code = encodeURIComponent(authError?.message || "create");
    redirect(`/settings/users/new?error=${code}`);
  }

  const { data: createdProfile, error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: authData.user.id,
        full_name: fullName,
        email,
        role,
        status,
        church_id: currentProfile.church_id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select("id")
    .single();

  if (profileError || !createdProfile) {
    redirect(`/settings/users/new?error=${encodeURIComponent(profileError?.message || "profile")}`);
  }

  revalidatePath("/settings/users");

  redirect(`/settings/users?profileId=${createdProfile.id}&created=1`);
}
