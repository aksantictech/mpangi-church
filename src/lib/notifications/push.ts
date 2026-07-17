import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

const PUSH_TIMEOUT_MS = 10_000;
const PUSH_BATCH_SIZE = 25;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 500;
const MAX_DATA_LENGTH = 1_500;

let configuredSignature = "";

type PushSubscriptionRow = {
  id: string;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
};

type DeliveryResult = {
  success: boolean;
};

type NotificationLogStatus =
  | "sent"
  | "failed"
  | "skipped";

type PushConfiguration = {
  publicKey: string;
  privateKey: string;
  subject: string;
  valid: boolean;
};

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

function cleanText(
  value: string | null | undefined,
  maximumLength: number
) {
  return String(value || "")
    .trim()
    .slice(0, maximumLength);
}

function normalizeNotificationUrl(
  value: string | null | undefined
) {
  const url = cleanText(value, 2_048);

  if (!url) return "/";

  /*
   * Les notifications doivent ouvrir une route interne
   * du domaine qui a reçu la notification.
   */
  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\")
  ) {
    return url;
  }

  return "/";
}

function normalizeNotificationData(
  data: Record<string, unknown>
): Record<string, unknown> {
  try {
    const serialized = JSON.stringify(data);

    if (serialized.length > MAX_DATA_LENGTH) {
      return {};
    }

    const parsed: unknown = JSON.parse(serialized);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Les données complémentaires ne doivent pas bloquer l’envoi.
  }

  return {};
}

function getPushConfiguration(): PushConfiguration {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    "";

  const privateKey =
    process.env.VAPID_PRIVATE_KEY?.trim() || "";

  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    "mailto:aksantictech@gmail.com";

  return {
    publicKey,
    privateKey,
    subject,
    valid: Boolean(publicKey && privateKey),
  };
}

function configureWebPush(
  configuration: PushConfiguration
) {
  if (
    !configuration.publicKey ||
    !configuration.privateKey
  ) {
    throw new Error(
      "Variables VAPID manquantes dans l’environnement."
    );
  }

  const signature = [
    configuration.subject,
    configuration.publicKey,
    configuration.privateKey,
  ].join(":");

  if (configuredSignature === signature) {
    return;
  }

  webpush.setVapidDetails(
    configuration.subject,
    configuration.publicKey,
    configuration.privateKey
  );

  configuredSignature = signature;
}

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number
): Promise<T> {
  let timeout:
    | ReturnType<typeof setTimeout>
    | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(
            new Error(
              "Délai d’envoi Push dépassé."
            )
          );
        }, milliseconds);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function getPushStatusCode(
  error: unknown
): number | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("statusCode" in error)
  ) {
    return null;
  }

  const statusCode = Reflect.get(
    error,
    "statusCode"
  );

  return typeof statusCode === "number"
    ? statusCode
    : null;
}

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
  body: string;
  url: string;
  type: string;
  createdBy: string | null;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  status: NotificationLogStatus;
}) {
  try {
    const admin = createAdminClient();

    await admin
      .from("church_notification_logs")
      .insert({
        church_id: churchId,
        title,
        body: body || null,
        url: url || null,
        type,
        status,
        recipients_count: recipientsCount,
        success_count: successCount,
        failure_count: failureCount,
        created_by: createdBy,
      });
  } catch {
    /*
     * Une erreur du journal ne doit jamais
     * interrompre l’action principale.
     */
  }
}

async function deactivateSubscription(
  subscriptionId: string
) {
  try {
    const admin = createAdminClient();

    await admin
      .from(
        "church_notification_subscriptions"
      )
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);
  } catch {
    /*
     * Le nettoyage d’un ancien abonnement
     * reste une opération best-effort.
     */
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
  const normalizedChurchId = cleanText(
    churchId,
    128
  );

  const normalizedTitle = cleanText(
    title,
    MAX_TITLE_LENGTH
  );

  const normalizedBody = cleanText(
    body,
    MAX_BODY_LENGTH
  );

  const normalizedUrl =
    normalizeNotificationUrl(url);

  const normalizedType =
    cleanText(type, 64) || "manual";

  const normalizedData =
    normalizeNotificationData(data);

  if (!normalizedChurchId) {
    throw new Error(
      "L’identifiant de l’église est obligatoire."
    );
  }

  if (!normalizedTitle) {
    throw new Error(
      "Le titre de la notification est obligatoire."
    );
  }

  const admin = createAdminClient();

  const {
    data: subscriptions,
    error: subscriptionsError,
  } = await admin
    .from(
      "church_notification_subscriptions"
    )
    .select("id, endpoint, p256dh, auth")
    .eq("church_id", normalizedChurchId)
    .eq("active", true);

  if (subscriptionsError) {
    const warning =
      `Abonnements Push non chargés : ${subscriptionsError.message}`;

    await writeNotificationLog({
      churchId: normalizedChurchId,
      title: normalizedTitle,
      body: normalizedBody,
      url: normalizedUrl,
      type: normalizedType,
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

  const rows = (subscriptions ??
    []) as PushSubscriptionRow[];

  if (rows.length === 0) {
    await writeNotificationLog({
      churchId: normalizedChurchId,
      title: normalizedTitle,
      body: normalizedBody,
      url: normalizedUrl,
      type: normalizedType,
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

  const configuration =
    getPushConfiguration();

  if (!configuration.valid) {
    const warning =
      "Notification non envoyée : variables VAPID absentes de l’environnement.";

    await writeNotificationLog({
      churchId: normalizedChurchId,
      title: normalizedTitle,
      body: normalizedBody,
      url: normalizedUrl,
      type: normalizedType,
      createdBy,
      recipientsCount: rows.length,
      successCount: 0,
      failureCount: rows.length,
      status: "failed",
    });

    return {
      recipientsCount: rows.length,
      successCount: 0,
      failureCount: rows.length,
      warning,
    };
  }

  try {
    configureWebPush(configuration);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Configuration VAPID invalide.";

    await writeNotificationLog({
      churchId: normalizedChurchId,
      title: normalizedTitle,
      body: normalizedBody,
      url: normalizedUrl,
      type: normalizedType,
      createdBy,
      recipientsCount: rows.length,
      successCount: 0,
      failureCount: rows.length,
      status: "failed",
    });

    return {
      recipientsCount: rows.length,
      successCount: 0,
      failureCount: rows.length,
      warning: message,
    };
  }

  const payload = JSON.stringify({
    title: normalizedTitle,
    body: normalizedBody,
    url: normalizedUrl,
    type: normalizedType,
    data: normalizedData,
  });

  const results: DeliveryResult[] = [];

  /*
   * Les abonnements sont traités par petits groupes
   * afin de ne pas saturer le serveur.
   */
  for (
    let index = 0;
    index < rows.length;
    index += PUSH_BATCH_SIZE
  ) {
    const batch = rows.slice(
      index,
      index + PUSH_BATCH_SIZE
    );

    const batchResults = await Promise.all(
      batch.map(
        async (
          subscription
        ): Promise<DeliveryResult> => {
          if (
            !subscription.endpoint ||
            !subscription.p256dh ||
            !subscription.auth
          ) {
            await deactivateSubscription(
              subscription.id
            );

            return {
              success: false,
            };
          }

          try {
            await withTimeout(
              webpush.sendNotification(
                {
                  endpoint:
                    subscription.endpoint,
                  keys: {
                    p256dh:
                      subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                payload
              ),
              PUSH_TIMEOUT_MS
            );

            return {
              success: true,
            };
          } catch (error: unknown) {
            const statusCode =
              getPushStatusCode(error);

            /*
             * 404 et 410 indiquent généralement
             * un abonnement supprimé ou expiré.
             */
            if (
              statusCode === 404 ||
              statusCode === 410
            ) {
              await deactivateSubscription(
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

    results.push(...batchResults);
  }

  const successCount = results.filter(
    (result) => result.success
  ).length;

  const failureCount =
    results.length - successCount;

  await writeNotificationLog({
    churchId: normalizedChurchId,
    title: normalizedTitle,
    body: normalizedBody,
    url: normalizedUrl,
    type: normalizedType,
    createdBy,
    recipientsCount: rows.length,
    successCount,
    failureCount,
    status:
      successCount > 0 ? "sent" : "failed",
  });

  let warning: string | null = null;

  if (failureCount === rows.length) {
    warning =
      "Aucun appareil n’a reçu la notification.";
  } else if (failureCount > 0) {
    warning =
      `${failureCount} appareil(s) n’ont pas reçu la notification.`;
  }

  return {
    recipientsCount: rows.length,
    successCount,
    failureCount,
    warning,
  };
}