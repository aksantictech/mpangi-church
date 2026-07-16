"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { sendChurchNotification } from "@/lib/notifications/push";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from "@/lib/youtube";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(
  value: FormDataEntryValue | null
) {
  return value === null ||
    value === undefined
    ? ""
    : String(value).trim();
}

function normalizeStatus(
  status: string
) {
  if (
    [
      "draft",
      "published",
      "archived",
    ].includes(status)
  ) {
    return status;
  }

  return "draft";
}

function payloadFromForm(
  formData: FormData
) {
  const youtubeUrl =
    text(
      formData.get(
        "youtube_url"
      )
    );

  const videoId =
    extractYouTubeVideoId(
      youtubeUrl
    );

  const status =
    normalizeStatus(
      text(
        formData.get(
          "status"
        )
      )
    );

  const now =
    new Date().toISOString();

  return {
    title:
      text(
        formData.get("title")
      ),

    description:
      text(
        formData.get(
          "description"
        )
      ) || null,

    youtube_url:
      youtubeUrl,

    youtube_video_id:
      videoId,

    thumbnail_url:
      videoId
        ? getYouTubeThumbnailUrl(
            videoId
          )
        : null,

    teacher_name:
      text(
        formData.get(
          "teacher_name"
        )
      ) || null,

    category:
      text(
        formData.get(
          "category"
        )
      ) || null,

    status,

    is_featured:
      formData.get(
        "is_featured"
      ) === "on",

    published_at:
      status === "published"
        ? now
        : null,
  };
}

async function getChurchSlug(
  admin: any,
  churchId: string
) {
  const {
    data: church,
  } = await admin
    .from("churches")
    .select("slug")
    .eq("id", churchId)
    .maybeSingle();

  return church?.slug || "";
}

async function notifyTeachingSafely({
  admin,
  churchId,
  profileId,
  teachingId,
  title,
}: {
  admin: any;
  churchId: string;
  profileId: string;
  teachingId: string;
  title: string;
}) {
  try {
    const slug =
      await getChurchSlug(
        admin,
        churchId
      );

    const result =
      await sendChurchNotification({
        churchId,
        title:
          "Nouvel enseignement publié",
        body: title,
        url: slug
          ? `/church/${slug}/teachings/${teachingId}`
          : "/teachings",
        type:
          "teaching_published",
        createdBy:
          profileId,
        data: {
          teachingId,
        },
      });

    return result.warning;
  } catch (error: any) {
    return (
      error?.message ||
      "La notification n’a pas pu être envoyée."
    );
  }
}

function encodedError(
  value: unknown
) {
  return encodeURIComponent(
    String(
      value ||
      "Erreur inconnue"
    )
  );
}

export async function createTeachingAction(
  formData: FormData
) {
  await requireAnyActionPermission(
    ["teachings"],
    "create"
  );

  const {
    admin,
    profile,
  } =
    await requireChurchModuleAccess(
      "teachings"
    );

  const payload =
    payloadFromForm(
      formData
    );

  if (
    !payload.title ||
    !payload.youtube_url ||
    !payload.youtube_video_id
  ) {
    redirect(
      "/teachings/new?error=Le+titre+et+un+lien+YouTube+valide+sont+obligatoires."
    );
  }

  const {
    data,
    error,
  } = await admin
    .from(
      "church_teachings"
    )
    .insert({
      church_id:
        profile.church_id,
      ...payload,
      created_by:
        profile.id,
      updated_by:
        profile.id,
    })
    .select(
      "id, status, title, description"
    )
    .single();

  if (error || !data) {
    redirect(
      `/teachings/new?error=${encodedError(
        error?.message ||
          "Impossible d’enregistrer l’enseignement."
      )}`
    );
  }

  let notifyWarning:
    | string
    | null = null;

  if (
    payload.status ===
    "published"
  ) {
    notifyWarning =
      await notifyTeachingSafely({
        admin,
        churchId:
          profile.church_id,
        profileId:
          profile.id,
        teachingId:
          data.id,
        title:
          payload.title,
      });
  }

  revalidatePath(
    "/teachings"
  );

  revalidatePath(
    "/church"
  );

  const warningQuery =
    notifyWarning
      ? `&notifyWarning=${encodedError(
          notifyWarning
        )}`
      : "";

  redirect(
    `/teachings/${data.id}?created=1${warningQuery}`
  );
}

export async function updateTeachingAction(
  formData: FormData
) {
  await requireAnyActionPermission(
    ["teachings"],
    "update"
  );

  const {
    admin,
    profile,
  } =
    await requireChurchModuleAccess(
      "teachings"
    );

  const id =
    text(
      formData.get("id")
    );

  const payload =
    payloadFromForm(
      formData
    );

  if (!id) {
    redirect("/teachings");
  }

  if (
    !payload.title ||
    !payload.youtube_url ||
    !payload.youtube_video_id
  ) {
    redirect(
      `/teachings/${id}/edit?error=Le+titre+et+un+lien+YouTube+valide+sont+obligatoires.`
    );
  }

  const {
    error,
  } = await admin
    .from(
      "church_teachings"
    )
    .update({
      ...payload,
      updated_by:
        profile.id,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "church_id",
      profile.church_id
    )
    .eq("id", id);

  if (error) {
    redirect(
      `/teachings/${id}/edit?error=${encodedError(
        error.message
      )}`
    );
  }

  revalidatePath(
    "/teachings"
  );

  revalidatePath(
    `/teachings/${id}`
  );

  redirect(
    `/teachings/${id}?updated=1`
  );
}

export async function publishTeachingAction(
  formData: FormData
) {
  await requireAnyActionPermission(
    ["teachings"],
    "update"
  );

  const {
    admin,
    profile,
  } =
    await requireChurchModuleAccess(
      "teachings"
    );

  const id =
    text(
      formData.get("id")
    );

  if (!id) {
    redirect("/teachings");
  }

  const now =
    new Date().toISOString();

  const {
    data: teaching,
    error,
  } = await admin
    .from(
      "church_teachings"
    )
    .update({
      status:
        "published",
      published_at: now,
      updated_by:
        profile.id,
      updated_at: now,
    })
    .eq(
      "church_id",
      profile.church_id
    )
    .eq("id", id)
    .select(
      "id, title, description"
    )
    .single();

  if (
    error ||
    !teaching
  ) {
    redirect(
      `/teachings/${id}?error=${encodedError(
        error?.message ||
          "Impossible de publier l’enseignement."
      )}`
    );
  }

  const notifyWarning =
    await notifyTeachingSafely({
      admin,
      churchId:
        profile.church_id,
      profileId:
        profile.id,
      teachingId:
        teaching.id,
      title:
        teaching.title,
    });

  revalidatePath(
    "/teachings"
  );

  revalidatePath(
    `/teachings/${id}`
  );

  const warningQuery =
    notifyWarning
      ? `&notifyWarning=${encodedError(
          notifyWarning
        )}`
      : "";

  redirect(
    `/teachings/${id}?published=1${warningQuery}`
  );
}

export async function archiveTeachingAction(
  formData: FormData
) {
  await requireAnyActionPermission(
    ["teachings"],
    "delete"
  );

  const {
    admin,
    profile,
  } =
    await requireChurchModuleAccess(
      "teachings"
    );

  const id =
    text(
      formData.get("id")
    );

  if (!id) {
    redirect("/teachings");
  }

  const {
    error,
  } = await admin
    .from(
      "church_teachings"
    )
    .update({
      status:
        "archived",
      updated_by:
        profile.id,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "church_id",
      profile.church_id
    )
    .eq("id", id);

  if (error) {
    redirect(
      `/teachings?error=${encodedError(
        error.message
      )}`
    );
  }

  revalidatePath(
    "/teachings"
  );

  redirect(
    "/teachings?archived=1"
  );
}
