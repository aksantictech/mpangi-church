import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
    const payload =
      await request.json();

    const subscription =
      (payload.subscription ||
        payload) as BrowserPushSubscription;

    const endpoint =
      subscription?.endpoint;

    const p256dh =
      subscription?.keys?.p256dh;

    const auth =
      subscription?.keys?.auth;

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          error:
            "Subscription push invalide.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profileId:
      | string
      | null = null;

    let churchId:
      | string
      | null =
      payload.churchId || null;

    if (user) {
      const { data: profile } =
        await supabase
          .from("profiles")
          .select(
            "id, church_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (profile?.id) {
        profileId =
          profile.id;
      }

      if (
        profile?.church_id
      ) {
        churchId =
          profile.church_id;
      }
    }

    if (
      !churchId &&
      payload.churchSlug
    ) {
      const { data: church } =
        await admin
          .from("churches")
          .select(
            "id, status, public_enabled"
          )
          .eq(
            "slug",
            String(
              payload.churchSlug
            ).trim()
          )
          .maybeSingle();

      if (
        church?.id &&
        church.status ===
          "active" &&
        church.public_enabled
      ) {
        churchId =
          church.id;
      }
    }

    if (!churchId) {
      return NextResponse.json(
        {
          error:
            "Église introuvable pour cette notification.",
        },
        { status: 400 }
      );
    }

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
            profile_id:
              profileId,
            endpoint,
            p256dh,
            auth,
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
      ok: true,
      message:
        "Notifications activées.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Impossible d’activer les notifications.",
      },
      { status: 500 }
    );
  }
}
