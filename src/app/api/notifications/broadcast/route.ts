import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type BroadcastBody = {
  title?: string;
  body?: string;
  url?: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeUrl(value: string) {
  const url = value.trim();

  if (!url) return "/";
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  if (url.startsWith("/")) return url;

  return `/${url}`;
}

async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      error: "Utilisateur non connecté.",
      status: 401,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      profile: null,
      error: "Profil utilisateur introuvable.",
      status: 403,
    };
  }

  if (profile.status && profile.status !== "active") {
    return {
      profile: null,
      error: "Compte désactivé.",
      status: 403,
    };
  }

  if (profile.role === "super_admin") {
    return {
      profile: null,
      error: "Action réservée aux administrateurs d’église.",
      status: 403,
    };
  }

  if (!profile.church_id) {
    return {
      profile: null,
      error: "Aucune église rattachée à ce compte.",
      status: 403,
    };
  }

  return {
    profile,
    error: null,
    status: 200,
  };
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT || "mailto:aksantictech@gmail.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  return true;
}

function toWebPushSubscription(subscription: PushSubscriptionRow) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BroadcastBody;

    const title = getString(body.title);
    const messageBody = getString(body.body);
    const url = normalizeUrl(getString(body.url) || "/");

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Le titre et le message sont obligatoires." },
        { status: 400 }
      );
    }

    if (title.length > 70) {
      return NextResponse.json(
        { error: "Le titre ne doit pas dépasser 70 caractères." },
        { status: 400 }
      );
    }

    if (messageBody.length > 180) {
      return NextResponse.json(
        { error: "Le message ne doit pas dépasser 180 caractères." },
        { status: 400 }
      );
    }

    const { profile, error, status } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error }, { status });
    }

    const vapidConfigured = configureWebPush();

    if (!vapidConfigured) {
      return NextResponse.json(
        {
          error:
            "Les clés VAPID ne sont pas configurées. Vérifiez NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY.",
        },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    const { data: church } = await admin
      .from("churches")
      .select("id, name, public_name, pwa_name, logo_url, slug")
      .eq("id", profile.church_id)
      .maybeSingle();

    if (!church) {
      return NextResponse.json(
        { error: "Église introuvable." },
        { status: 404 }
      );
    }

    const { data: subscriptions } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("church_id", profile.church_id);

    const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRow[];

    if (activeSubscriptions.length === 0) {
      await admin.from("notification_logs").insert({
        church_id: profile.church_id,
        title,
        body: messageBody,
        target: "all",
        sent_count: 0,
        failed_count: 0,
        sent_by: profile.id,
      });

      return NextResponse.json(
        {
          error:
            "Aucun appareil abonné aux notifications pour cette église.",
        },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      url,
      icon: church.logo_url || "/images/mpangi-logo.png",
      badge: "/images/mpangi-logo.png",
      churchId: church.id,
      churchSlug: church.slug,
      tag: `church-${church.id}-broadcast-${Date.now()}`,
    });

    let sentCount = 0;
    let failedCount = 0;
    const invalidSubscriptionIds: string[] = [];

    await Promise.all(
      activeSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            toWebPushSubscription(subscription),
            payload
          );

          sentCount += 1;
        } catch (sendError: any) {
          failedCount += 1;

          if (
            sendError?.statusCode === 404 ||
            sendError?.statusCode === 410
          ) {
            invalidSubscriptionIds.push(subscription.id);
          }
        }
      })
    );

    if (invalidSubscriptionIds.length > 0) {
      await admin
        .from("push_subscriptions")
        .delete()
        .in("id", invalidSubscriptionIds);
    }

    await admin.from("notification_logs").insert({
      church_id: profile.church_id,
      title,
      body: messageBody,
      target: "all",
      sent_count: sentCount,
      failed_count: failedCount,
      sent_by: profile.id,
    });

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      removedInvalidSubscriptions: invalidSubscriptionIds.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant l’envoi de la notification." },
      { status: 500 }
    );
  }
}
