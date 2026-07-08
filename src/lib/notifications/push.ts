import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function configureWebPush() {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT || "mailto:aksantictech@gmail.com";

  if (!publicKey || !privateKey) {
    throw new Error(
      "Variables VAPID manquantes : NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type SendChurchNotificationInput = {
  churchId: string;
  title: string;
  body?: string;
  url?: string;
  type?: string;
  createdBy?: string | null;
  data?: Record<string, unknown>;
};

export async function sendChurchNotification({
  churchId,
  title,
  body,
  url,
  type = "manual",
  createdBy = null,
  data = {},
}: SendChurchNotificationInput) {
  configureWebPush();

  const admin = createAdminClient();

  const { data: subscriptions } = await admin
    .from("church_notification_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("church_id", churchId)
    .eq("active", true);

  const rows = subscriptions ?? [];

  let successCount = 0;
  let failureCount = 0;

  const payload = JSON.stringify({
    title,
    body: body || "",
    url: url || "/",
    type,
    data,
  });

  await Promise.all(
    rows.map(async (subscription: any) => {
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

        successCount += 1;
      } catch (error: any) {
        failureCount += 1;

        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await admin
            .from("church_notification_subscriptions")
            .update({
              active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
        }
      }
    })
  );

  await admin.from("church_notification_logs").insert({
    church_id: churchId,
    title,
    body: body || null,
    url: url || null,
    type,
    status: failureCount > 0 && successCount === 0 ? "failed" : "sent",
    recipients_count: rows.length,
    success_count: successCount,
    failure_count: failureCount,
    created_by: createdBy,
  });

  return {
    recipientsCount: rows.length,
    successCount,
    failureCount,
  };
}
