import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendChurchNotification } from "@/lib/notifications/push";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
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

    const { data: previousChurch } = await admin
      .from("churches")
      .select("id, live_stream_enabled, live_stream_url, live_stream_title")
      .eq("id", profile.church_id)
      .maybeSingle();

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

    let recipientsCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let warning: string | null = null;
    let notified = false;

    const justStarted =
      liveStreamEnabled &&
      Boolean(liveStreamUrl) &&
      (!previousChurch?.live_stream_enabled ||
        String(previousChurch?.live_stream_url || "").trim() !== liveStreamUrl);

    const shouldNotify =
      liveStreamEnabled &&
      Boolean(liveStreamUrl) &&
      (Boolean(body.notify) || justStarted);

    if (shouldNotify) {
      const notification = await sendChurchNotification({
        churchId: profile.church_id,
        title: `🔴 ${liveStreamTitle || "Culte en direct"}`,
        body:
          liveStreamDescription ||
          "Le culte en direct vient de commencer. Cliquez pour suivre.",
        url: "/live",
        type: "live_stream",
        createdBy: profile.id,
        data: {
          platform: liveStreamPlatform || null,
          liveTitle: liveStreamTitle || null,
        },
      });

      recipientsCount = notification.recipientsCount;
      sentCount = notification.successCount;
      failedCount = notification.failureCount;
      warning = notification.warning;
      notified = sentCount > 0;

      if (notified) {
        await admin
          .from("churches")
          .update({
            live_stream_notified_at: new Date().toISOString(),
          })
          .eq("id", profile.church_id);
      }
    }

    return NextResponse.json({
      success: true,
      recipientsCount,
      sentCount,
      failedCount,
      warning,
      notified,
      automaticNotification: justStarted && !body.notify,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant la publication du direct." },
      { status: 500 }
    );
  }
}
