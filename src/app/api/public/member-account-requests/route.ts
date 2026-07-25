import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit/logAuditEvent";
import { createAdminClient } from "@/lib/supabase/admin";

function text(value: unknown) {
  return String(value || "").trim();
}

function parseIdentifier(raw: string) {
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/member-card\/([^/]+)/);
    return match?.[1] || raw;
  } catch {
    try {
      const parsed = JSON.parse(raw);
      return text(parsed.qr_token || parsed.member_code || parsed.member_id || raw);
    } catch {
      return raw;
    }
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const churchSlug = text(body.churchSlug);
  const identifier = parseIdentifier(text(body.identifier));
  const email = text(body.email).toLowerCase();
  const phone = text(body.phone);
  const justification = text(body.justification);

  if (!churchSlug || !identifier || !email || !email.includes("@")) {
    return NextResponse.json({ error: "Le numéro membre/QR et une adresse email valide sont obligatoires." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: church } = await admin.from("churches").select("id, name, status, public_enabled").eq("slug", churchSlug).maybeSingle();
  if (!church || church.status !== "active" || !church.public_enabled) {
    return NextResponse.json({ error: "Église indisponible." }, { status: 404 });
  }

  const { data: candidates } = await admin
    .from("members")
    .select("id, first_name, middle_name, last_name, member_code, qr_token, qr_code, phone, email, status")
    .eq("church_id", church.id)
    .or(`member_code.eq.${identifier},qr_token.eq.${identifier},qr_code.eq.${identifier}`)
    .limit(2);
  const member = candidates?.[0];

  if (!member) {
    await logAuditEvent({ churchId: church.id, actorEmail: email, action: "account_request.member_not_found", category: "account_request", status: "denied", severity: "medium", route: `/church/${churchSlug}/account-request` });
    return NextResponse.json({ error: "Aucun membre ne correspond à ce numéro ou QR dans cette église." }, { status: 404 });
  }

  if (member.status && !["active", "actif"].includes(member.status)) {
    return NextResponse.json({ error: "Cette fiche membre n’est pas active. Contactez l’église." }, { status: 403 });
  }

  const fullName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ");
  const { data: created, error } = await admin.from("member_account_requests").insert({
    church_id: church.id,
    member_id: member.id,
    member_code: member.member_code,
    qr_token: member.qr_token,
    full_name: fullName,
    email,
    phone: phone || member.phone || null,
    justification: justification || null,
    requested_user_agent: request.headers.get("user-agent"),
    requested_ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  }).select("id").single();

  if (error || !created) {
    const duplicate = error?.code === "23505";
    return NextResponse.json({ error: duplicate ? "Une demande est déjà en attente pour ce membre ou cet email." : "Impossible d’enregistrer la demande." }, { status: duplicate ? 409 : 400 });
  }

  await logAuditEvent({
    churchId: church.id,
    actorEmail: email,
    action: "account_request.created",
    category: "account_request",
    resourceType: "member_account_request",
    resourceId: created.id,
    route: `/church/${churchSlug}/account-request`,
    metadata: { memberId: member.id, memberCode: member.member_code },
  });
  return NextResponse.json({ message: "Votre demande a été transmise. L’administrateur de l’église doit maintenant la valider." });
}

