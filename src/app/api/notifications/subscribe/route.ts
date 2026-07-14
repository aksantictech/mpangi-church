import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";
export async function POST(request: Request) {
  await requireAuthenticatedAccess();
  try {
    const payload = await request.json();

    const subscription = payload.subscription || payload;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Subscription push invalide." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profileId: string | null = null;
    let churchId: string | null = payload.churchId || null;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, church_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.id) profileId = profile.id;
      if (profile?.church_id) churchId = profile.church_id;
    }

    if (!churchId && payload.churchSlug) {
      const { data: church } = await admin
        .from("churches")
        .select("id")
        .eq("slug", payload.churchSlug)
        .maybeSingle();

      if (church?.id) churchId = church.id;
    }

    if (!churchId) {
      return NextResponse.json(
        { error: "Église introuvable pour cette notification." },
        { status: 400 }
      );
    }

    await admin.from("church_notification_subscriptions").upsert(
      {
        church_id: churchId,
        profile_id: profileId,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get("user-agent"),
        active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible d’activer les notifications." },
      { status: 500 }
    );
  }
}
