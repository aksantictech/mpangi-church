import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BrowserPushSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const churchId =
      String(
        body.churchId || ""
      ).trim();

    const subscription =
      body.subscription as BrowserPushSubscription;

    if (
      !churchId ||
      !subscription?.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        {
          error:
            "Abonnement invalide.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    const { data: church } =
      await admin
        .from("churches")
        .select(
          "id, status, public_enabled"
        )
        .eq("id", churchId)
        .maybeSingle();

    if (
      !church ||
      church.status !==
        "active" ||
      !church.public_enabled
    ) {
      return NextResponse.json(
        {
          error:
            "Église non disponible.",
        },
        { status: 404 }
      );
    }

    const { error } =
      await admin
        .from(
          "church_notification_subscriptions"
        )
        .upsert(
          {
            church_id:
              churchId,
            profile_id: null,
            endpoint:
              subscription.endpoint,
            p256dh:
              subscription.keys.p256dh,
            auth:
              subscription.keys.auth,
            user_agent:
              request.headers.get(
                "user-agent"
              ),
            active: true,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "endpoint",
          }
        );

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Notifications activées.",
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
