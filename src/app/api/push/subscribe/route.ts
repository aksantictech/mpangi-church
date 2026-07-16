import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BrowserPushSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const churchId = String(
      body.churchId || ""
    ).trim();

    const subscription =
      body.subscription as BrowserPushSubscription;

    if (
      !churchId ||
      !subscription?.endpoint
    ) {
      return NextResponse.json(
        {
          error:
            "Abonnement invalide : église ou endpoint manquant.",
        },
        { status: 400 }
      );
    }

    const p256dh =
      subscription.keys?.p256dh;

    const auth =
      subscription.keys?.auth;

    if (!p256dh || !auth) {
      return NextResponse.json(
        {
          error:
            "Clés d’abonnement Push invalides.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: church,
      error: churchError,
    } = await admin
      .from("churches")
      .select(
        "id, status, public_enabled"
      )
      .eq("id", churchId)
      .maybeSingle();

    if (
      churchError ||
      !church ||
      church.status !== "active" ||
      !church.public_enabled
    ) {
      return NextResponse.json(
        {
          error:
            "Église non disponible pour les notifications.",
        },
        { status: 404 }
      );
    }

    const {
      error: subscriptionError,
    } = await admin
      .from(
        "church_notification_subscriptions"
      )
      .upsert(
        {
          church_id: churchId,
          profile_id: null,
          endpoint:
            subscription.endpoint,
          p256dh,
          auth,
          user_agent:
            request.headers.get(
              "user-agent"
            ) || null,
          active: true,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (subscriptionError) {
      return NextResponse.json(
        {
          error:
            subscriptionError.message,
          code:
            subscriptionError.code ||
            null,
          details:
            subscriptionError.details ||
            null,
          hint:
            subscriptionError.hint ||
            null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Notifications activées sur cet appareil.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erreur pendant l’activation des notifications.",
      },
      { status: 500 }
    );
  }
}
