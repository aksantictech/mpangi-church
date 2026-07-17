import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PUSH_KEY_PATTERN =
  /^[A-Za-z0-9_-]+$/;

type ProfileRow = {
  id: string;
  church_id: string | null;
  status: string | null;
};

type ChurchRow = {
  id: string;
  status: string | null;
  public_enabled: boolean | null;
};

type ValidatedSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
  maximumLength: number
) {
  return typeof value === "string"
    ? value.trim().slice(0, maximumLength)
    : "";
}

function normalizeChurchSlug(
  value: unknown
) {
  return readString(value, 120)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readJsonPayload(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const payload: unknown =
      await request.json();

    return isRecord(payload)
      ? payload
      : null;
  } catch {
    return null;
  }
}

function getSubscriptionSource(
  payload: Record<string, unknown>
) {
  const nestedSubscription =
    payload.subscription;

  if (isRecord(nestedSubscription)) {
    return nestedSubscription;
  }

  return payload;
}

function validateSubscription(
  payload: Record<string, unknown>
): ValidatedSubscription | null {
  const source =
    getSubscriptionSource(payload);

  const keys = isRecord(source.keys)
    ? source.keys
    : null;

  const endpoint = readString(
    source.endpoint,
    4_096
  );

  const p256dh = readString(
    keys?.p256dh,
    512
  );

  const auth = readString(
    keys?.auth,
    512
  );

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  try {
    const endpointUrl = new URL(endpoint);

    if (endpointUrl.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  if (
    !PUSH_KEY_PATTERN.test(p256dh) ||
    !PUSH_KEY_PATTERN.test(auth)
  ) {
    return null;
  }

  return {
    endpoint,
    p256dh,
    auth,
  };
}

export async function POST(
  request: Request
) {
  const payload =
    await readJsonPayload(request);

  if (!payload) {
    return NextResponse.json(
      {
        error:
          "Corps de requête JSON invalide.",
      },
      { status: 400 }
    );
  }

  const subscription =
    validateSubscription(payload);

  if (!subscription) {
    return NextResponse.json(
      {
        error:
          "Abonnement Push invalide.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileId: string | null = null;
  let churchId: string | null = null;

  /*
   * true signifie que l’église a été obtenue
   * depuis le profil authentifié.
   */
  let authenticatedChurch = false;

  if (user) {
    const {
      data: profileData,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, church_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          error:
            "Impossible de vérifier le profil utilisateur.",
        },
        { status: 500 }
      );
    }

    const profile =
      profileData as ProfileRow | null;

    if (
      profile?.status &&
      profile.status !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "Ce compte utilisateur est inactif.",
        },
        { status: 403 }
      );
    }

    if (profile?.id) {
      profileId = profile.id;
    }

    if (profile?.church_id) {
      churchId = profile.church_id;
      authenticatedChurch = true;
    }
  }

  /*
   * Un utilisateur authentifié reste toujours
   * rattaché à l’église de son profil.
   *
   * Pour un visiteur public, l’église est
   * résolue à partir du slug ou de l’identifiant.
   */
  if (!churchId) {
    const requestedSlug =
      normalizeChurchSlug(
        payload.churchSlug
      );

    const requestedChurchId =
      readString(
        payload.churchId,
        128
      );

    if (requestedSlug) {
      const {
        data: churchData,
        error: churchError,
      } = await admin
        .from("churches")
        .select(
          "id, status, public_enabled"
        )
        .eq("slug", requestedSlug)
        .maybeSingle();

      if (churchError) {
        return NextResponse.json(
          {
            error:
              "Impossible de vérifier l’église.",
          },
          { status: 500 }
        );
      }

      const church =
        churchData as ChurchRow | null;

      if (
        !church ||
        church.status !== "active" ||
        !church.public_enabled
      ) {
        return NextResponse.json(
          {
            error:
              "Église publique non disponible.",
          },
          { status: 404 }
        );
      }

      churchId = church.id;
    } else if (
      requestedChurchId &&
      UUID_PATTERN.test(
        requestedChurchId
      )
    ) {
      const {
        data: churchData,
        error: churchError,
      } = await admin
        .from("churches")
        .select(
          "id, status, public_enabled"
        )
        .eq("id", requestedChurchId)
        .maybeSingle();

      if (churchError) {
        return NextResponse.json(
          {
            error:
              "Impossible de vérifier l’église.",
          },
          { status: 500 }
        );
      }

      const church =
        churchData as ChurchRow | null;

      if (
        !church ||
        church.status !== "active" ||
        !church.public_enabled
      ) {
        return NextResponse.json(
          {
            error:
              "Église publique non disponible.",
          },
          { status: 404 }
        );
      }

      churchId = church.id;
    }
  }

  if (!churchId) {
    return NextResponse.json(
      {
        error:
          "Église introuvable pour cet abonnement.",
      },
      { status: 400 }
    );
  }

  /*
   * Une église provenant d’un profil authentifié
   * doit être active, mais elle n’a pas besoin
   * d’avoir sa page publique activée.
   */
  if (authenticatedChurch) {
    const {
      data: churchData,
      error: churchError,
    } = await admin
      .from("churches")
      .select(
        "id, status, public_enabled"
      )
      .eq("id", churchId)
      .maybeSingle();

    if (churchError) {
      return NextResponse.json(
        {
          error:
            "Impossible de vérifier l’église.",
        },
        { status: 500 }
      );
    }

    const church =
      churchData as ChurchRow | null;

    if (
      !church ||
      church.status !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "Église non disponible.",
        },
        { status: 404 }
      );
    }
  }

  const userAgent = readString(
    request.headers.get("user-agent"),
    512
  );

  const now =
    new Date().toISOString();

  const { error: upsertError } =
    await admin
      .from(
        "church_notification_subscriptions"
      )
      .upsert(
        {
          church_id: churchId,
          profile_id: profileId,
          endpoint:
            subscription.endpoint,
          p256dh:
            subscription.p256dh,
          auth: subscription.auth,
          user_agent:
            userAgent || null,
          active: true,
          updated_at: now,
        },
        {
          onConflict: "endpoint",
        }
      );

  if (upsertError) {
    return NextResponse.json(
      {
        error:
          "Impossible d’enregistrer l’abonnement Push.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Notifications activées.",
  });
}

export async function DELETE(
  request: Request
) {
  const payload =
    await readJsonPayload(request);

  if (!payload) {
    return NextResponse.json(
      {
        error:
          "Corps de requête JSON invalide.",
      },
      { status: 400 }
    );
  }

  const source =
    getSubscriptionSource(payload);

  const endpoint = readString(
    source.endpoint,
    4_096
  );

  if (!endpoint) {
    return NextResponse.json(
      {
        error:
          "Endpoint Push obligatoire.",
      },
      { status: 400 }
    );
  }

  try {
    const endpointUrl = new URL(endpoint);

    if (endpointUrl.protocol !== "https:") {
      throw new Error(
        "Protocole invalide."
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "Endpoint Push invalide.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  /*
   * L’endpoint Push est une valeur longue et
   * aléatoire propre au navigateur. La réponse
   * reste volontairement identique, même si
   * l’abonnement n’existe plus.
   */
  const { error } = await admin
    .from(
      "church_notification_subscriptions"
    )
    .update({
      active: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json(
      {
        error:
          "Impossible de désactiver les notifications.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Notifications désactivées.",
  });
}