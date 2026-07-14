import { NextResponse } from "next/server";
import { CHURCH_DOCUMENTS_BUCKET } from "@/lib/storage/churchDocuments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
function getString(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export async function GET(request: Request) {
  await requireAnyModulePermission(["correspondence","inbox","transmissions","document_transmissions","minutes","meetings_minutes","assets","members","teachings"], "view");
  const url = new URL(request.url);
  const path = getString(url.searchParams.get("path"));
  const filename = getString(url.searchParams.get("filename"));

  if (!path) {
    return NextResponse.json({ error: "Chemin du document manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non connecté." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || (profile.status && profile.status !== "active")) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  if (profile.role !== "super_admin") {
    if (!profile.church_id || !path.startsWith(`${profile.church_id}/`)) {
      return NextResponse.json({ error: "Accès au document refusé." }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(CHURCH_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60, { download: filename || true });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Lien de téléchargement impossible." }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
