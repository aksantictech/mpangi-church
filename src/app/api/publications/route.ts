import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CreatePublicationBody = {
  title?: string;
  description?: string;
  content?: string;
  publicationType?: string;
  videoUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  notify?: boolean;
};

type PatchPublicationBody = {
  publicationId?: string;
  action?: "publish" | "unpublish" | "feature" | "unfeature" | "notify" | "delete";
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return null;

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  const watchMatch = url.match(/[?&]v=([^&]+)/);

  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);

  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
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

async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Utilisateur non connecté.",
      status: 401,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      error: "Profil utilisateur introuvable.",
      status: 404,
      profile: null,
    };
  }

  if (profile.status && profile.status !== "active") {
    return {
      error: "Compte désactivé.",
      status: 403,
      profile: null,
    };
  }

  if (profile.role === "super_admin") {
    return {
      error: "Action réservée aux administrateurs d’église.",
      status: 403,
      profile: null,
    };
  }

  if (!profile.church_id) {
    return {
      error: "Aucune église rattachée à ce compte.",
      status: 400,
      profile: null,
    };
  }

  return {
    error: null,
    status: 200,
    profile,
  };
}

async function sendPublicationNotification({
  churchId,
  title,
  body,
}: {
  churchId: string;
  title: string;
  body: string;
}) {
  const configured = configureWebPush();

  if (!configured) {
    return {
      sentCount: 0,
      failedCount: 0,
      warning:
        "Publication enregistrée, mais notifications non envoyées : clés VAPID manquantes.",
    };
  }

  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("id, slug, name, public_name")
    .eq("id", churchId)
    .maybeSingle();

  if (!church?.slug) {
    return {
      sentCount: 0,
      failedCount: 0,
      warning: "Église introuvable pour l’envoi des notifications.",
    };
  }

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("church_id", churchId);

  const payload = JSON.stringify({
    title,
    body,
    url: `/church/${church.slug}`,
    icon: "/images/mpangi-logo.png",
    badge: "/images/mpangi-logo.png",
  });

  let sentCount = 0;
  let failedCount = 0;

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

  return {
    sentCount,
    failedCount,
    warning: null,
  };
}

export async function POST(request: Request) {
  try {
    const { profile, error, status } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error }, { status });
    }

    const body = (await request.json()) as CreatePublicationBody;

    const title = getString(body.title);
    const description = getString(body.description);
    const content = getString(body.content);
    const publicationType = getString(body.publicationType) || "teaching";
    const videoUrl = getString(body.videoUrl);

    if (!title) {
      return NextResponse.json(
        { error: "Le titre est obligatoire." },
        { status: 400 }
      );
    }

    if (
      !["teaching", "video", "message", "announcement", "sermon"].includes(
        publicationType
      )
    ) {
      return NextResponse.json(
        { error: "Type de publication invalide." },
        { status: 400 }
      );
    }

    const isPublished = Boolean(body.isPublished || body.notify);
    const videoEmbedUrl = videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

    const admin = createAdminClient();

    const { data: publication, error: insertError } = await admin
      .from("church_publications")
      .insert({
        church_id: profile.church_id,
        title,
        description: description || null,
        content: content || null,
        publication_type: publicationType,
        video_url: videoUrl || null,
        video_embed_url: videoEmbedUrl,
        is_published: isPublished,
        is_featured: Boolean(body.isFeatured),
        published_at: isPublished ? new Date().toISOString() : null,
        created_by: profile.id,
      })
      .select("id, title, description")
      .single();

    if (insertError || !publication) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Impossible d’enregistrer la publication.",
        },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    let warning: string | null = null;

    if (body.notify) {
      const notifyResult = await sendPublicationNotification({
        churchId: profile.church_id,
        title: `Nouvel enseignement : ${title}`,
        body:
          description ||
          "Un nouvel enseignement vient d’être publié par votre église.",
      });

      sentCount = notifyResult.sentCount;
      failedCount = notifyResult.failedCount;
      warning = notifyResult.warning;

      await admin
        .from("church_publications")
        .update({
          notified_at: new Date().toISOString(),
        })
        .eq("id", publication.id);
    }

    return NextResponse.json({
      success: true,
      publicationId: publication.id,
      sentCount,
      failedCount,
      warning,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant la publication." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, error, status } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error }, { status });
    }

    const body = (await request.json()) as PatchPublicationBody;

    const publicationId = getString(body.publicationId);
    const action = body.action;

    if (!publicationId || !action) {
      return NextResponse.json(
        { error: "Action invalide." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: publication } = await admin
      .from("church_publications")
      .select("id, church_id, title, description, is_published, is_featured")
      .eq("id", publicationId)
      .eq("church_id", profile.church_id)
      .maybeSingle();

    if (!publication) {
      return NextResponse.json(
        { error: "Publication introuvable." },
        { status: 404 }
      );
    }

    if (action === "delete") {
      const { error: deleteError } = await admin
        .from("church_publications")
        .delete()
        .eq("id", publicationId)
        .eq("church_id", profile.church_id);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "notify") {
      if (!publication.is_published) {
        await admin
          .from("church_publications")
          .update({
            is_published: true,
            published_at: new Date().toISOString(),
          })
          .eq("id", publicationId)
          .eq("church_id", profile.church_id);
      }

      const notifyResult = await sendPublicationNotification({
        churchId: profile.church_id,
        title: `Nouvel enseignement : ${publication.title}`,
        body:
          publication.description ||
          "Un nouvel enseignement vient d’être publié par votre église.",
      });

      await admin
        .from("church_publications")
        .update({
          notified_at: new Date().toISOString(),
        })
        .eq("id", publicationId)
        .eq("church_id", profile.church_id);

      return NextResponse.json({
        success: true,
        sentCount: notifyResult.sentCount,
        failedCount: notifyResult.failedCount,
        warning: notifyResult.warning,
      });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "publish") {
      updates.is_published = true;
      updates.published_at = new Date().toISOString();
    }

    if (action === "unpublish") {
      updates.is_published = false;
    }

    if (action === "feature") {
      updates.is_featured = true;
    }

    if (action === "unfeature") {
      updates.is_featured = false;
    }

    const { error: updateError } = await admin
      .from("church_publications")
      .update(updates)
      .eq("id", publicationId)
      .eq("church_id", profile.church_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant la mise à jour." },
      { status: 500 }
    );
  }
}