import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendChurchNotification } from "@/lib/notifications/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PublicationAction =
  | "publish"
  | "unpublish"
  | "feature"
  | "unfeature"
  | "notify"
  | "delete";

type PatchPublicationBody = {
  publicationId?: string;
  action?: PublicationAction;
};

const PUBLICATION_TYPES = new Set([
  "news",
  "event",
  "announcement",
  "teaching",
  "sermon",
  "video",
  "message",
]);

const PUBLICATION_BUCKET = "church-publications";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

function getString(value: unknown, maxLength = 5000) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().slice(0, maxLength);
}

function getBoolean(value: unknown) {
  return (
    value === true ||
    value === "true" ||
    value === "on" ||
    value === "1"
  );
}

function getYoutubeVideoId(url: string) {
  if (!url) return null;

  const watchMatch = url.match(/[?&]v=([^&]+)/);

  if (watchMatch?.[1]) {
    return watchMatch[1];
  }

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);

  if (shortMatch?.[1]) {
    return shortMatch[1];
  }

  const embedMatch = url.match(
    /youtube\.com\/embed\/([^?&/]+)/
  );

  return embedMatch?.[1] || null;
}

function getPublicationTypeLabel(value: string) {
  if (value === "news") return "Actualité";
  if (value === "event") return "Événement";
  if (value === "announcement") return "Annonce";
  if (value === "sermon") return "Prédication";
  if (value === "video") return "Vidéo";
  if (value === "message") return "Message";
  return "Enseignement";
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
    .select("id, user_id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      error: "Profil utilisateur introuvable.",
      status: 404,
      profile: null,
    };
  }

  if (
    profile.status &&
    !["active", "actif"].includes(profile.status)
  ) {
    return {
      error: "Compte désactivé.",
      status: 403,
      profile: null,
    };
  }

  if (
    profile.role === "super_admin" ||
    !profile.church_id
  ) {
    return {
      error:
        "Cette action doit être effectuée depuis un espace église.",
      status: 403,
      profile: null,
    };
  }

  return {
    error: null,
    status: 200,
    profile,
  };
}

async function parseCreateBody(request: Request) {
  const contentType =
    request.headers.get("content-type") || "";

  if (
    contentType.includes(
      "multipart/form-data"
    )
  ) {
    const formData =
      await request.formData();

    const imageValue =
      formData.get("coverImage");

    return {
      title: getString(
        formData.get("title"),
        180
      ),
      excerpt: getString(
        formData.get("description"),
        1000
      ),
      content: getString(
        formData.get("content"),
        10000
      ),
      category:
        getString(
          formData.get("publicationType"),
          40
        ) || "teaching",
      videoUrl: getString(
        formData.get("videoUrl"),
        1000
      ),
      isPublished: getBoolean(
        formData.get("isPublished")
      ),
      isFeatured: getBoolean(
        formData.get("isFeatured")
      ),
      notify: getBoolean(
        formData.get("notify")
      ),
      coverImage:
        imageValue instanceof File &&
        imageValue.size > 0
          ? imageValue
          : null,
    };
  }

  const body =
    (await request.json()) as Record<
      string,
      unknown
    >;

  return {
    title: getString(
      body.title,
      180
    ),
    excerpt: getString(
      body.description,
      1000
    ),
    content: getString(
      body.content,
      10000
    ),
    category:
      getString(
        body.publicationType,
        40
      ) || "teaching",
    videoUrl: getString(
      body.videoUrl,
      1000
    ),
    isPublished: getBoolean(
      body.isPublished
    ),
    isFeatured: getBoolean(
      body.isFeatured
    ),
    notify: getBoolean(body.notify),
    coverImage: null as File | null,
  };
}

async function uploadCoverImage({
  admin,
  churchId,
  file,
}: {
  admin: ReturnType<
    typeof createAdminClient
  >;
  churchId: string;
  file: File;
}) {
  const allowedTypes =
    new Map<string, string>([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
    ]);

  const extension =
    allowedTypes.get(file.type);

  if (!extension) {
    throw new Error(
      "La photo doit être au format JPG, PNG ou WebP."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "La photo ne peut pas dépasser 4 Mo."
    );
  }

  const objectPath = `${churchId}/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`;

  const content = Buffer.from(
    await file.arrayBuffer()
  );

  const { error } = await admin.storage
    .from(PUBLICATION_BUCKET)
    .upload(objectPath, content, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Photo non envoyée : ${error.message}`
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage
    .from(PUBLICATION_BUCKET)
    .getPublicUrl(objectPath);

  return {
    imageUrl: publicUrl,
    imagePath: objectPath,
  };
}

async function notifySubscribers({
  churchId,
  profileId,
  title,
  excerpt,
  category,
}: {
  churchId: string;
  profileId: string;
  title: string;
  excerpt: string;
  category: string;
}) {
  try {
    const result =
      await sendChurchNotification({
        churchId,
        createdBy: profileId,
        title: `${getPublicationTypeLabel(
          category
        )} : ${title}`,
        body:
          excerpt ||
          "Une nouvelle publication vient d’être ajoutée par votre église.",
        url: "/#actualites",
        type: "publication",
        data: {
          category,
        },
      });

    return {
      sentCount:
        result.successCount,
      failedCount:
        result.failureCount,
      warning:
        result.recipientsCount === 0
          ? "Publication enregistrée, mais aucun appareil n’est encore abonné."
          : null,
    };
  } catch (error: any) {
    return {
      sentCount: 0,
      failedCount: 0,
      warning:
        error?.message ||
        "Publication enregistrée, mais les notifications n’ont pas pu être envoyées.",
    };
  }
}

export async function POST(
  request: Request
) {
  let uploadedImagePath:
    | string
    | null = null;

  try {
    const {
      profile,
      error,
      status,
    } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error },
        { status }
      );
    }

    const body =
      await parseCreateBody(request);

    if (!body.title) {
      return NextResponse.json(
        {
          error:
            "Le titre est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (
      !PUBLICATION_TYPES.has(
        body.category
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Type de publication invalide.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    let imageUrl: string | null =
      null;

    if (body.coverImage) {
      const uploaded =
        await uploadCoverImage({
          admin,
          churchId:
            profile.church_id,
          file: body.coverImage,
        });

      imageUrl =
        uploaded.imageUrl;
      uploadedImagePath =
        uploaded.imagePath;
    }

    const published =
      body.isPublished ||
      body.notify;

    const youtubeVideoId =
      getYoutubeVideoId(
        body.videoUrl
      );

    const {
      data: publication,
      error: insertError,
    } = await admin
      .from(
        "church_publications"
      )
      .insert({
        church_id:
          profile.church_id,
        title: body.title,
        excerpt:
          body.excerpt || null,
        content:
          body.content || null,
        category:
          body.category,
        image_url:
          imageUrl,
        image_path:
          uploadedImagePath,
        video_url:
          body.videoUrl || null,
        youtube_url:
          body.videoUrl || null,
        youtube_video_id:
          youtubeVideoId,
        status: published
          ? "published"
          : "draft",
        is_public: true,
        is_featured:
          body.isFeatured,
        notify_subscribers:
          body.notify,
        published_at: published
          ? new Date().toISOString()
          : null,
        notified_at: null,
        created_by:
          profile.id,
        updated_by:
          profile.id,
      })
      .select(
        "id, title, excerpt, category"
      )
      .single();

    if (
      insertError ||
      !publication
    ) {
      if (uploadedImagePath) {
        await admin.storage
          .from(
            PUBLICATION_BUCKET
          )
          .remove([
            uploadedImagePath,
          ]);
      }

      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Impossible d’enregistrer la publication.",
          code:
            insertError?.code ||
            null,
          details:
            insertError?.details ||
            null,
          hint:
            insertError?.hint ||
            null,
        },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    let warning:
      | string
      | null = null;

    if (body.notify) {
      const notifyResult =
        await notifySubscribers({
          churchId:
            profile.church_id,
          profileId:
            profile.id,
          title:
            publication.title,
          excerpt:
            publication.excerpt ||
            "",
          category:
            publication.category ||
            "teaching",
        });

      sentCount =
        notifyResult.sentCount;
      failedCount =
        notifyResult.failedCount;
      warning =
        notifyResult.warning;

      await admin
        .from(
          "church_publications"
        )
        .update({
          notified_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          publication.id
        )
        .eq(
          "church_id",
          profile.church_id
        );
    }

    return NextResponse.json({
      success: true,
      publicationId:
        publication.id,
      sentCount,
      failedCount,
      warning,
    });
  } catch (caughtError: any) {
    return NextResponse.json(
      {
        error:
          caughtError?.message ||
          "Erreur inattendue pendant la publication.",
        code:
          caughtError?.code ||
          null,
        details:
          caughtError?.details ||
          null,
        hint:
          caughtError?.hint ||
          null,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const {
      profile,
      error,
      status,
    } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error },
        { status }
      );
    }

    const body =
      (await request.json()) as PatchPublicationBody;

    const publicationId =
      getString(
        body.publicationId,
        80
      );

    const action =
      body.action;

    if (
      !publicationId ||
      !action
    ) {
      return NextResponse.json(
        {
          error:
            "Action invalide.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: publication,
      error:
        publicationError,
    } = await admin
      .from(
        "church_publications"
      )
      .select(
        "id, church_id, title, excerpt, category, status, is_featured, image_path"
      )
      .eq("id", publicationId)
      .eq(
        "church_id",
        profile.church_id
      )
      .maybeSingle();

    if (
      publicationError ||
      !publication
    ) {
      return NextResponse.json(
        {
          error:
            publicationError?.message ||
            "Publication introuvable.",
        },
        { status: 404 }
      );
    }

    if (action === "delete") {
      const { error: deleteError } =
        await admin
          .from(
            "church_publications"
          )
          .delete()
          .eq(
            "id",
            publicationId
          )
          .eq(
            "church_id",
            profile.church_id
          );

      if (deleteError) {
        return NextResponse.json(
          {
            error:
              deleteError.message,
          },
          { status: 400 }
        );
      }

      if (
        publication.image_path
      ) {
        await admin.storage
          .from(
            PUBLICATION_BUCKET
          )
          .remove([
            publication.image_path,
          ]);
      }

      return NextResponse.json({
        success: true,
      });
    }

    if (action === "notify") {
      if (
        publication.status !==
        "published"
      ) {
        await admin
          .from(
            "church_publications"
          )
          .update({
            status: "published",
            is_public: true,
            published_at:
              new Date().toISOString(),
            updated_by:
              profile.id,
          })
          .eq(
            "id",
            publicationId
          )
          .eq(
            "church_id",
            profile.church_id
          );
      }

      const notifyResult =
        await notifySubscribers({
          churchId:
            profile.church_id,
          profileId:
            profile.id,
          title:
            publication.title,
          excerpt:
            publication.excerpt ||
            "",
          category:
            publication.category ||
            "teaching",
        });

      await admin
        .from(
          "church_publications"
        )
        .update({
          notified_at:
            new Date().toISOString(),
          notify_subscribers:
            true,
          updated_by:
            profile.id,
        })
        .eq(
          "id",
          publicationId
        )
        .eq(
          "church_id",
          profile.church_id
        );

      return NextResponse.json({
        success: true,
        sentCount:
          notifyResult.sentCount,
        failedCount:
          notifyResult.failedCount,
        warning:
          notifyResult.warning,
      });
    }

    const updates: Record<
      string,
      unknown
    > = {
      updated_at:
        new Date().toISOString(),
      updated_by:
        profile.id,
    };

    if (action === "publish") {
      updates.status =
        "published";
      updates.is_public = true;
      updates.published_at =
        new Date().toISOString();
    }

    if (
      action === "unpublish"
    ) {
      updates.status = "draft";
    }

    if (action === "feature") {
      updates.is_featured = true;
    }

    if (
      action === "unfeature"
    ) {
      updates.is_featured = false;
    }

    const { error: updateError } =
      await admin
        .from(
          "church_publications"
        )
        .update(updates)
        .eq(
          "id",
          publicationId
        )
        .eq(
          "church_id",
          profile.church_id
        );

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message,
          code:
            updateError.code ||
            null,
          details:
            updateError.details ||
            null,
          hint:
            updateError.hint ||
            null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (caughtError: any) {
    return NextResponse.json(
      {
        error:
          caughtError?.message ||
          "Erreur inattendue pendant la mise à jour.",
        code:
          caughtError?.code ||
          null,
        details:
          caughtError?.details ||
          null,
        hint:
          caughtError?.hint ||
          null,
      },
      { status: 500 }
    );
  }
}
