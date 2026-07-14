import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";
type BrowserPushSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  await requireAuthenticatedAccess();
  try {
    const body = await request.json();

    const churchId = String(body.churchId || "").trim();
    const subscription = body.subscription as BrowserPushSubscription;

    if (!churchId || !subscription?.endpoint) {
      return NextResponse.json(
        { error: "Abonnement invalide." },
        { status: 400 }
      );
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: "Clés d’abonnement invalides." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: church } = await admin
      .from("churches")
      .select("id, status, public_enabled")
      .eq("id", churchId)
      .maybeSingle();

    if (!church || church.status !== "active" || !church.public_enabled) {
      return NextResponse.json(
        { error: "Église non disponible." },
        { status: 404 }
      );
    }

    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await admin.from("push_subscriptions").upsert(
      {
        church_id: churchId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "church_id,endpoint",
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Notifications activées.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur pendant l’activation des notifications." },
      { status: 500 }
    );
  }
}