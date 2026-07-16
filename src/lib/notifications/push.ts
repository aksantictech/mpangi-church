import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function getPushConfiguration() {
  const publicKey =
    process.env
      .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const privateKey =
    process.env
      .VAPID_PRIVATE_KEY;

  const subject =
    process.env.VAPID_SUBJECT ||
    "mailto:aksantictech@gmail.com";

  return {
    publicKey,
    privateKey,
    subject,
    valid:
      Boolean(publicKey) &&
      Boolean(privateKey),
  };
}

function configureWebPush() {
  if (configured) return;

  const config =
    getPushConfiguration();

  if (
    !config.publicKey ||
    !config.privateKey
  ) {
    throw new Error(
      "Variables VAPID manquantes dans Vercel."
    );
  }

  webpush.setVapidDetails(
    config.subject,
    config.publicKey,
    config.privateKey
  );

  configured = true;
}

function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number
) {
  return Promise.race([
    promise,
    new Promise<never>(
      (_resolve, reject) => {
        const timeout =
          setTimeout(() => {
            clearTimeout(timeout);

            reject(
              new Error(
                "Délai d’envoi Push dépassé."
              )
            );
          }, milliseconds);
      }
    ),
  ]);
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

export type SendChurchNotificationResult = {
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  warning: string | null;
};

async function writeNotificationLog({
  churchId,
  title,
  body,
  url,
  type,
  createdBy,
  recipientsCount,
  successCount,
  failureCount,
  status,
}: {
  churchId: string;
  title: string;
  body?: string;
  url?: string;
  type: string;
  createdBy: string | null;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  status: string;
}) {
  try {
    const admin =
      createAdminClient();

    await admin
      .from(
        "church_notification_logs"
      )
      .insert({
        church_id: churchId,
        title,
        body: body || null,
        url: url || null,
        type,
        status,
        recipients_count:
          recipientsCount,
        success_count:
          successCount,
        failure_count:
          failureCount,
        created_by:
          createdBy,
      });
  } catch {
    // Le journal ne doit jamais bloquer l’action métier.
  }
}

export async function sendChurchNotification({
  churchId,
  title,
  body,
  url,
  type = "manual",
  createdBy = null,
  data = {},
}: SendChurchNotificationInput): Promise<SendChurchNotificationResult> {
  const admin =
    createAdminClient();

  const {
    data: subscriptions,
    error: subscriptionsError,
  } = await admin
    .from(
      "church_notification_subscriptions"
    )
    .select(
      "id, endpoint, p256dh, auth"
    )
    .eq("church_id", churchId)
    .eq("active", true);

  if (subscriptionsError) {
    const warning =
      `Abonnements Push non chargés : ${subscriptionsError.message}`;

    await writeNotificationLog({
      churchId,
      title,
      body,
      url,
      type,
      createdBy,
      recipientsCount: 0,
      successCount: 0,
      failureCount: 0,
      status: "failed",
    });

    return {
      recipientsCount: 0,
      successCount: 0,
      failureCount: 0,
      warning,
    };
  }

  const rows =
    subscriptions ?? [];

  if (rows.length === 0) {
    await writeNotificationLog({
      churchId,
      title,
      body,
      url,
      type,
      createdBy,
      recipientsCount: 0,
      successCount: 0,
      failureCount: 0,
      status: "skipped",
    });

    return {
      recipientsCount: 0,
      successCount: 0,
      failureCount: 0,
      warning:
        "Aucun appareil n’est encore abonné.",
    };
  }

  const config =
    getPushConfiguration();

  if (!config.valid) {
    const warning =
      "Notification non envoyée : variables VAPID absentes dans Vercel.";

    await writeNotificationLog({
      churchId,
      title,
      body,
      url,
      type,
      createdBy,
      recipientsCount:
        rows.length,
      successCount: 0,
      failureCount:
        rows.length,
      status: "failed",
    });

    return {
      recipientsCount:
        rows.length,
      successCount: 0,
      failureCount:
        rows.length,
      warning,
    };
  }

  configureWebPush();

  const payload =
    JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
      type,
      data,
    });

  const results =
    await Promise.all(
      rows.map(
        async (
          subscription: any
        ) => {
          try {
            await withTimeout(
              webpush.sendNotification(
                {
                  endpoint:
                    subscription.endpoint,
                  keys: {
                    p256dh:
                      subscription.p256dh,
                    auth:
                      subscription.auth,
                  },
                },
                payload
              ),
              10000
            );

            return {
              success: true,
            };
          } catch (
            error: any
          ) {
            if (
              error?.statusCode ===
                404 ||
              error?.statusCode ===
                410
            ) {
              await admin
                .from(
                  "church_notification_subscriptions"
                )
                .update({
                  active: false,
                  updated_at:
                    new Date().toISOString(),
                })
                .eq(
                  "id",
                  subscription.id
                );
            }

            return {
              success: false,
            };
          }
        }
      )
    );

  const successCount =
    results.filter(
      (item) => item.success
    ).length;

  const failureCount =
    results.length -
    successCount;

  await writeNotificationLog({
    churchId,
    title,
    body,
    url,
    type,
    createdBy,
    recipientsCount:
      rows.length,
    successCount,
    failureCount,
    status:
      successCount > 0
        ? "sent"
        : "failed",
  });

  return {
    recipientsCount:
      rows.length,
    successCount,
    failureCount,
    warning:
      failureCount > 0
        ? `${failureCount} appareil(s) n’ont pas reçu la notification.`
        : null,
  };
}
