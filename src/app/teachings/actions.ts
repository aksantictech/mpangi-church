"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { sendChurchNotification } from "@/lib/notifications/push";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from "@/lib/youtube";

function text(value: FormDataEntryValue | null) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeStatus(status: string) {
  if (["draft", "published", "archived"].includes(status)) return status;
  return "draft";
}

function payloadFromForm(formData: FormData) {
  const youtubeUrl = text(formData.get("youtube_url"));
  const videoId = extractYouTubeVideoId(youtubeUrl);
  const status = normalizeStatus(text(formData.get("status")));
  const now = new Date().toISOString();

  return {
    title: text(formData.get("title")),
    description: text(formData.get("description")) || null,
    youtube_url: youtubeUrl,
    youtube_video_id: videoId,
    thumbnail_url: videoId ? getYouTubeThumbnailUrl(videoId) : null,
    teacher_name: text(formData.get("teacher_name")) || null,
    category: text(formData.get("category")) || null,
    status,
    is_featured: formData.get("is_featured") === "on",
    published_at: status === "published" ? now : null,
  };
}

async function getChurchSlug(admin: any, churchId: string) {
  const { data: church } = await admin
    .from("churches")
    .select("slug")
    .eq("id", churchId)
    .maybeSingle();

  return church?.slug || "";
}

export async function createTeachingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("teachings");
  const payload = payloadFromForm(formData);

  if (!payload.title || !payload.youtube_url || !payload.youtube_video_id) {
    redirect("/teachings/new?error=required");
  }

  const { data, error } = await admin
    .from("church_teachings")
    .insert({
      church_id: profile.church_id,
      ...payload,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, status, title, description")
    .single();

  if (error || !data) {
    redirect(`/teachings/new?error=${encodeURIComponent(error?.message || "create")}`);
  }

  if (payload.status === "published") {
    const slug = await getChurchSlug(admin, profile.church_id);

    await sendChurchNotification({
      churchId: profile.church_id,
      title: "Nouvel enseignement publié",
      body: payload.title,
      url: slug ? `/church/${slug}/teachings/${data.id}` : "/teachings",
      type: "teaching_published",
      createdBy: profile.id,
      data: { teachingId: data.id },
    });
  }

  revalidatePath("/teachings");
  revalidatePath("/church");
  redirect(`/teachings/${data.id}`);
}

export async function updateTeachingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("teachings");
  const id = text(formData.get("id"));
  const payload = payloadFromForm(formData);

  if (!id) redirect("/teachings");

  if (!payload.title || !payload.youtube_url || !payload.youtube_video_id) {
    redirect(`/teachings/${id}/edit?error=required`);
  }

  const { error } = await admin
    .from("church_teachings")
    .update({
      ...payload,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (error) {
    redirect(`/teachings/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teachings");
  revalidatePath(`/teachings/${id}`);
  redirect(`/teachings/${id}`);
}

export async function publishTeachingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("teachings");
  const id = text(formData.get("id"));

  if (!id) redirect("/teachings");

  const now = new Date().toISOString();

  const { data: teaching } = await admin
    .from("church_teachings")
    .update({
      status: "published",
      published_at: now,
      updated_by: profile.id,
      updated_at: now,
    })
    .eq("church_id", profile.church_id)
    .eq("id", id)
    .select("id, title, description")
    .single();

  if (teaching) {
    const slug = await getChurchSlug(admin, profile.church_id);

    await sendChurchNotification({
      churchId: profile.church_id,
      title: "Nouvel enseignement publié",
      body: teaching.title,
      url: slug ? `/church/${slug}/teachings/${teaching.id}` : "/teachings",
      type: "teaching_published",
      createdBy: profile.id,
      data: { teachingId: teaching.id },
    });
  }

  revalidatePath("/teachings");
  revalidatePath(`/teachings/${id}`);
  redirect(`/teachings/${id}?published=1`);
}

export async function archiveTeachingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("teachings");
  const id = text(formData.get("id"));

  if (!id) redirect("/teachings");

  await admin
    .from("church_teachings")
    .update({
      status: "archived",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/teachings");
  redirect("/teachings");
}
