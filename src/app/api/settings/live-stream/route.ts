import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
type RequestBody = {
  liveStreamEnabled?: boolean;
  liveStreamUrl?: string;
  liveStreamTitle?: string;
  liveStreamDescription?: string;
  liveStreamPlatform?: string;
  notify?: boolean;
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@aksantictech.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function POST(request: Request) {
  await requireAnyActionPermission(["settings"], "create");
  try {
    const body = (await request.json()) as RequestBody;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, church_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || !profile.church_id) {
      return NextResponse.json(
        { error: "Profil utilisateur invalide." },
        { status: 403 }
      );
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 }
      );
    }

    if (profile.role === "super_admin") {
      return NextResponse.json(
        { error: "Action réservée aux administrateurs d’église." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const liveStreamEnabled = Boolean(body.liveStreamEnabled);
    const liveStreamUrl = getString(body.liveStreamUrl);
    const liveStreamTitle = getString(body.liveStreamTitle);
    const liveStreamDescription = getString(body.liveStreamDescription);
    const liveStreamPlatform = getString(body.liveStreamPlatform);

    if (liveStreamEnabled && !liveStreamUrl) {
      return NextResponse.json(
        { error: "Le lien du direct est obligatoire si le direct est activé." },
        { status: 400 }
      );
    }

    const { data: church, error: churchError } = await admin
      .from("churches")
      .update({
        live_stream_enabled: liveStreamEnabled,
        live_stream_url: liveStreamUrl || null,
        live_stream_title: liveStreamTitle || null,
        live_stream_description: liveStreamDescription || null,
        live_stream_platform: liveStreamPlatform || null,
        live_stream_started_at: liveStreamEnabled
          ? new Date().toISOString()
          : null,
      })
      .eq("id", profile.church_id)
      .select("id, slug, name, public_name")
      .single();

    if (churchError || !church) {
      return NextResponse.json(
        { error: churchError?.message || "Église introuvable." },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    if (body.notify && liveStreamEnabled && liveStreamUrl) {
      const configured = configureWebPush();

      if (!configured) {
        return NextResponse.json(
          {
            error:
              "Notifications non configurées. Vérifie les clés VAPID dans .env.local et Vercel.",
          },
          { status: 400 }
        );
      }

      const { data: subscriptions } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("church_id", profile.church_id);

      const payload = JSON.stringify({
        title: `🔴 ${liveStreamTitle || "Culte en direct"}`,
        body:
          liveStreamDescription ||
          "Le culte en direct vient de commencer. Cliquez pour suivre.",
        url: `/church/${church.slug}`,
        icon: "/images/mpangi-logo.png",
        badge: "/images/mpangi-logo.png",
      });

      for (const subscription of subscriptions ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );

          sentCount += 1;
        } catch (error: any) {
          failedCount += 1;

          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await admin
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
          }
        }
      }

      await admin
        .from("churches")
        .update({
          live_stream_notified_at: new Date().toISOString(),
        })
        .eq("id", profile.church_id);
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant la publication du direct." },
      { status: 500 }
    );
  }
}