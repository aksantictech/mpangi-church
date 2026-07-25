import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit/logAuditEvent";
import { requireChurchAdmin } from "@/lib/security/access";

async function findAuthUser(admin: any, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item: any) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const body = await request.json();
  const decision = String(body.decision || "");
  const reason = String(body.reason || "").trim();
  if (!["approved", "rejected", "needs_information"].includes(decision)) {
    return NextResponse.json({ error: "Décision invalide." }, { status: 400 });
  }

  const context = await requireChurchAdmin();
  const { admin, churchId, profile, role } = context;
  const { data: accountRequest } = await admin
    .from("member_account_requests")
    .select("*")
    .eq("id", requestId)
    .eq("church_id", churchId)
    .maybeSingle();

  if (!accountRequest || !["pending", "needs_information"].includes(accountRequest.status)) {
    return NextResponse.json({ error: "Demande introuvable ou déjà traitée." }, { status: 404 });
  }

  let authUserId: string | null = accountRequest.auth_user_id;
  if (decision === "approved") {
    const existingUser = await findAuthUser(admin, accountRequest.email);
    if (existingUser) {
      const { data: existingProfile } = await admin.from("profiles").select("id, church_id, member_id").eq("user_id", existingUser.id).maybeSingle();
      if (existingProfile?.church_id && existingProfile.church_id !== churchId) {
        return NextResponse.json({ error: "Cet email appartient déjà à un compte d’une autre église." }, { status: 409 });
      }
      authUserId = existingUser.id;
    } else {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(accountRequest.email, {
        data: { full_name: accountRequest.full_name, role: "member", church_id: churchId, member_id: accountRequest.member_id },
      });
      if (error || !data.user) return NextResponse.json({ error: error?.message || "Invitation impossible." }, { status: 400 });
      authUserId = data.user.id;
    }

    const profilePayload = {
      user_id: authUserId,
      email: accountRequest.email,
      full_name: accountRequest.full_name,
      role: "member",
      status: "active",
      church_id: churchId,
      member_id: accountRequest.member_id,
    };
    const { data: existingProfile } = await admin.from("profiles").select("id").eq("user_id", authUserId).maybeSingle();
    const profileResult = existingProfile
      ? await admin.from("profiles").update(profilePayload).eq("id", existingProfile.id)
      : await admin.from("profiles").insert(profilePayload);
    if (profileResult.error) return NextResponse.json({ error: profileResult.error.message }, { status: 400 });
  }

  const { error: updateError } = await admin.from("member_account_requests").update({
    status: decision,
    decision_reason: reason || null,
    reviewed_by: profile.id,
    reviewed_at: new Date().toISOString(),
    auth_user_id: authUserId,
  }).eq("id", requestId).eq("church_id", churchId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await logAuditEvent({
    churchId,
    actorUserId: profile.user_id,
    actorEmail: profile.email,
    actorRole: role,
    action: `account_request.${decision}`,
    category: "account_request",
    resourceType: "member_account_request",
    resourceId: requestId,
    severity: decision === "rejected" ? "medium" : "low",
    oldValues: { status: accountRequest.status },
    newValues: { status: decision, authUserId },
    metadata: { memberId: accountRequest.member_id, reason: reason || null },
  });
  return NextResponse.json({ message: decision === "approved" ? "Compte approuvé. Une invitation sécurisée a été envoyée." : "La décision a été enregistrée." });
}

