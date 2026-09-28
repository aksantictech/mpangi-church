"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicField = { key: string; label: string; type: string; required?: boolean; options?: string[] };
const clean = (value: FormDataEntryValue | null, limit: number) => String(value || "").trim().slice(0, limit);

export async function submitPublicChurchFormAction(formData: FormData) {
  const slug = clean(formData.get("church_slug"), 120);
  const token = clean(formData.get("form_token"), 100);
  const honeypot = clean(formData.get("website"), 200);
  if (!slug || !token || honeypot) redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?error=invalid`);

  const admin = createAdminClient();
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const fingerprint = createHash("sha256").update(`${forwardedFor}|${requestHeaders.get("user-agent") || "unknown"}|${slug}|${process.env.SUPABASE_SERVICE_ROLE_KEY || "mpangi"}`).digest("hex");
  const { data: church } = await admin.from("churches").select("id,slug,status,public_enabled").eq("slug", slug).maybeSingle();
  if (!church || church.status !== "active" || church.public_enabled === false) redirect(`/church/${encodeURIComponent(slug)}?error=church`);

  const { data: form } = await admin.from("church_forms").select("id,church_id,fields,status,public_enabled").eq("church_id", church.id).eq("public_token", token).maybeSingle();
  if (!form || form.status !== "published" || !form.public_enabled) redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?error=closed`);

  const rateWindow = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: recentSubmissions } = await admin.from("church_form_submissions").select("id", { count: "exact", head: true }).eq("church_id", church.id).eq("form_id", form.id).eq("submission_fingerprint", fingerprint).gte("created_at", rateWindow);
  if ((recentSubmissions || 0) >= 5) redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?error=rate`);

  const fields = (Array.isArray(form.fields) ? form.fields : []) as PublicField[];
  const answers: Record<string, string> = {};
  for (const field of fields.slice(0, 30)) {
    const value = clean(formData.get(`answer_${field.key}`), field.type === "textarea" ? 4000 : 500);
    if (field.required && !value) redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?error=required`);
    if (field.type === "select" && value && !(field.options || []).includes(value)) redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?error=invalid`);
    answers[`${field.key}:${field.label.slice(0, 100)}`] = value;
  }

  const nameField = fields.find((field) => /nom|name/i.test(field.label));
  const emailField = fields.find((field) => field.type === "email");
  const phoneField = fields.find((field) => field.type === "tel" || /téléphone|telephone|phone/i.test(field.label));
  const { error } = await admin.from("church_form_submissions").insert({
    church_id: church.id,
    form_id: form.id,
    respondent_name: nameField ? answers[`${nameField.key}:${nameField.label.slice(0, 100)}`] || null : null,
    respondent_email: emailField ? answers[`${emailField.key}:${emailField.label.slice(0, 100)}`] || null : null,
    respondent_phone: phoneField ? answers[`${phoneField.key}:${phoneField.label.slice(0, 100)}`] || null : null,
    submission_fingerprint: fingerprint,
    answers,
    status: "new",
  });
  if (error) redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?error=save`);
  redirect(`/church/${encodeURIComponent(slug)}/registration/${encodeURIComponent(token)}?submitted=1`);
}
