import { NextResponse } from "next/server";

import { sendChurchNotification } from "@/lib/notifications/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventAction =
  | "activate"
  | "draft"
  | "complete"
  | "cancel";

type EventRequestBody = {
  eventId: string;
  churchId: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  action: string;
};

type CurrentProfile = {
  id: string;
  user_id: string | null;
  role: string | null;
  church_id: string;
  status: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
};

type NotificationSummary = {
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  warning: string | null;
};

const EVENT_STATUSES = new Set([
  "active",
  "draft",
  "completed",
  "cancelled",
]);

const ACTION_STATUS: Record<
  EventAction,
  string
> = {
  activate: "active",
  draft: "draft",
  complete: "completed",
  cancel: "cancelled",
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

function getString(
  value: unknown
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

async function readBody(
  request: Request
): Promise<EventRequestBody | null> {
  try {
    const payload: unknown =
      await request.json();

    if (!isRecord(payload)) {
      return null;
    }

    return {
      eventId: getString(
        payload.eventId
      ),
      churchId: getString(
        payload.churchId
      ),
      title: getString(
        payload.title
      ),
      description: getString(
        payload.description
      ),
      eventDate: getString(
        payload.event_date
      ),
      startTime: getString(
        payload.start_time
      ),
      endTime: getString(
        payload.end_time
      ),
      location: getString(
        payload.location
      ),
      status:
        getString(
          payload.status
        ) || "active",
      action: getString(
        payload.action
      ),
    };
  } catch {
    return null;
  }
}

async function getCurrentProfile() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      error:
        "Utilisateur non connecté.",
      status: 401,
    };
  }

  const admin =
    createAdminClient();

  const {
    data: profileData,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(
      "id, user_id, role, church_id, status"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profileData
  ) {
    return {
      profile: null,
      error:
        "Profil utilisateur introuvable.",
      status: 404,
    };
  }

  if (
    profileData.status &&
    !["active", "actif"].includes(
      profileData.status
    )
  ) {
    return {
      profile: null,
      error:
        "Compte désactivé.",
      status: 403,
    };
  }

  if (
    profileData.role ===
      "super_admin" ||
    !profileData.church_id
  ) {
    return {
      profile: null,
      error:
        "Cette action doit être effectuée depuis un espace église.",
      status: 403,
    };
  }

  return {
    profile:
      profileData as CurrentProfile,
    error: null,
    status: 200,
  };
}

function isValidDate(
  value: string
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() === day
  );
}

function parseTimeToSeconds(
  value: string
) {
  const match =
    /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      value
    );

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(
    match[3] || "0"
  );

  if (
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}

function validateEvent(
  input: EventRequestBody
) {
  if (!input.title) {
    return "Le titre de l’événement est obligatoire.";
  }

  if (
    input.title.length > 180
  ) {
    return "Le titre ne doit pas dépasser 180 caractères.";
  }

  if (
    input.description.length >
    10_000
  ) {
    return "La description est trop longue.";
  }

  if (
    input.location.length > 500
  ) {
    return "Le lieu ne doit pas dépasser 500 caractères.";
  }

  if (
    !isValidDate(
      input.eventDate
    )
  ) {
    return "La date de l’événement est invalide.";
  }

  if (
    !EVENT_STATUSES.has(
      input.status
    )
  ) {
    return "Le statut de l’événement est invalide.";
  }

  const startSeconds =
    input.startTime
      ? parseTimeToSeconds(
          input.startTime
        )
      : null;

  const endSeconds =
    input.endTime
      ? parseTimeToSeconds(
          input.endTime
        )
      : null;

  if (
    input.startTime &&
    startSeconds === null
  ) {
    return "L’heure de début est invalide.";
  }

  if (
    input.endTime &&
    endSeconds === null
  ) {
    return "L’heure de fin est invalide.";
  }

  if (
    startSeconds !== null &&
    endSeconds !== null &&
    endSeconds <= startSeconds
  ) {
    return "L’heure de fin doit être postérieure à l’heure de début.";
  }

  return null;
}

function formatEventDate(
  value: string
) {
  const [year, month, day] =
    value
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function formatEventTime(
  value: string | null
) {
  if (!value) return "";

  return value.slice(0, 5);
}

function buildEventMessage(
  event: EventRow
) {
  const details = [
    formatEventDate(
      event.event_date
    ),
  ];

  const startTime =
    formatEventTime(
      event.start_time
    );

  if (startTime) {
    details.push(
      `à ${startTime}`
    );
  }

  if (event.location) {
    details.push(
      `• ${event.location}`
    );
  }

  return details.join(" ");
}

async function notifyEvent({
  event,
  churchId,
  profileId,
  kind,
}: {
  event: EventRow;
  churchId: string;
  profileId: string;
  kind:
    | "published"
    | "cancelled";
}): Promise<NotificationSummary> {
  try {
    const title =
      kind === "cancelled"
        ? `Événement annulé : ${event.title}`
        : `Nouvel événement : ${event.title}`;

    const body =
      kind === "cancelled"
        ? `${buildEventMessage(
            event
          )}. Cet événement a été annulé.`
        : buildEventMessage(
            event
          );

    const result =
      await sendChurchNotification({
        churchId,
        title,
        body,
        /*
         * Les abonnements publics et internes
         * partagent la même table. La racine
         * publique reste accessible à tous.
         */
        url: "/",
        type: "event",
        createdBy: profileId,
        data: {
          eventId: event.id,
          eventDate:
            event.event_date,
          eventStatus:
            event.status,
          eventAction: kind,
        },
      });

    return {
      recipientsCount:
        result.recipientsCount,
      sentCount:
        result.successCount,
      failedCount:
        result.failureCount,
      warning: result.warning,
    };
  } catch {
    return {
      recipientsCount: 0,
      sentCount: 0,
      failedCount: 0,
      warning:
        "Événement enregistré, mais la notification n’a pas pu être envoyée.",
    };
  }
}

export async function POST(
  request: Request
) {
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
    await readBody(request);

  if (!body) {
    return NextResponse.json(
      {
        error:
          "Corps de requête JSON invalide.",
      },
      { status: 400 }
    );
  }

  if (
    body.churchId &&
    body.churchId !==
      profile.church_id
  ) {
    return NextResponse.json(
      {
        error:
          "Église invalide pour cette session.",
      },
      { status: 403 }
    );
  }

  const validationError =
    validateEvent(body);

  if (validationError) {
    return NextResponse.json(
      {
        error:
          validationError,
      },
      { status: 400 }
    );
  }

  try {
    const admin =
      createAdminClient();

    const {
      data: eventData,
      error: insertError,
    } = await admin
      .from("events")
      .insert({
        church_id:
          profile.church_id,
        title: body.title,
        description:
          body.description || null,
        event_date:
          body.eventDate,
        start_time:
          body.startTime || null,
        end_time:
          body.endTime || null,
        location:
          body.location || null,
        status: body.status,
      })
      .select(
        `
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          location,
          status
        `
      )
      .single();

    if (
      insertError ||
      !eventData
    ) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Création impossible.",
        },
        { status: 400 }
      );
    }

    const event =
      eventData as EventRow;

    const notification =
      event.status === "active"
        ? await notifyEvent({
            event,
            churchId:
              profile.church_id,
            profileId:
              profile.id,
            kind: "published",
          })
        : null;

    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
        notification,
        warning:
          notification?.warning ||
          null,
      },
      { status: 201 }
    );
  } catch (caughtError: unknown) {
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur pendant la création.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
) {
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
    await readBody(request);

  if (!body) {
    return NextResponse.json(
      {
        error:
          "Corps de requête JSON invalide.",
      },
      { status: 400 }
    );
  }

  if (!body.eventId) {
    return NextResponse.json(
      {
        error:
          "Identifiant événement manquant.",
      },
      { status: 400 }
    );
  }

  if (
    body.churchId &&
    body.churchId !==
      profile.church_id
  ) {
    return NextResponse.json(
      {
        error:
          "Église invalide pour cette session.",
      },
      { status: 403 }
    );
  }

  const validationError =
    validateEvent(body);

  if (validationError) {
    return NextResponse.json(
      {
        error:
          validationError,
      },
      { status: 400 }
    );
  }

  try {
    const admin =
      createAdminClient();

    const {
      data: previousData,
      error: previousError,
    } = await admin
      .from("events")
      .select(
        `
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          location,
          status
        `
      )
      .eq("id", body.eventId)
      .eq(
        "church_id",
        profile.church_id
      )
      .maybeSingle();

    if (previousError) {
      return NextResponse.json(
        {
          error:
            previousError.message,
        },
        { status: 400 }
      );
    }

    if (!previousData) {
      return NextResponse.json(
        {
          error:
            "Événement introuvable.",
        },
        { status: 404 }
      );
    }

    const previousEvent =
      previousData as EventRow;

    const {
      data: updatedData,
      error: updateError,
    } = await admin
      .from("events")
      .update({
        title: body.title,
        description:
          body.description || null,
        event_date:
          body.eventDate,
        start_time:
          body.startTime || null,
        end_time:
          body.endTime || null,
        location:
          body.location || null,
        status: body.status,
      })
      .eq("id", body.eventId)
      .eq(
        "church_id",
        profile.church_id
      )
      .select(
        `
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          location,
          status
        `
      )
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        { status: 400 }
      );
    }

    if (!updatedData) {
      return NextResponse.json(
        {
          error:
            "Événement introuvable.",
        },
        { status: 404 }
      );
    }

    const updatedEvent =
      updatedData as EventRow;

    let notification:
      | NotificationSummary
      | null = null;

    if (
      previousEvent.status !==
        "active" &&
      updatedEvent.status ===
        "active"
    ) {
      notification =
        await notifyEvent({
          event: updatedEvent,
          churchId:
            profile.church_id,
          profileId:
            profile.id,
          kind: "published",
        });
    } else if (
      previousEvent.status ===
        "active" &&
      updatedEvent.status ===
        "cancelled"
    ) {
      notification =
        await notifyEvent({
          event: updatedEvent,
          churchId:
            profile.church_id,
          profileId:
            profile.id,
          kind: "cancelled",
        });
    }

    return NextResponse.json({
      success: true,
      eventId: updatedEvent.id,
      notification,
      warning:
        notification?.warning ||
        null,
    });
  } catch (caughtError: unknown) {
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur pendant la modification.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
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
    await readBody(request);

  if (!body) {
    return NextResponse.json(
      {
        error:
          "Corps de requête JSON invalide.",
      },
      { status: 400 }
    );
  }

  const action =
    body.action as EventAction;

  if (
    !body.eventId ||
    !Object.prototype.hasOwnProperty.call(
      ACTION_STATUS,
      action
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Action événement invalide.",
      },
      { status: 400 }
    );
  }

  try {
    const admin =
      createAdminClient();

    const {
      data: previousData,
      error: previousError,
    } = await admin
      .from("events")
      .select(
        `
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          location,
          status
        `
      )
      .eq("id", body.eventId)
      .eq(
        "church_id",
        profile.church_id
      )
      .maybeSingle();

    if (previousError) {
      return NextResponse.json(
        {
          error:
            previousError.message,
        },
        { status: 400 }
      );
    }

    if (!previousData) {
      return NextResponse.json(
        {
          error:
            "Événement introuvable.",
        },
        { status: 404 }
      );
    }

    const previousEvent =
      previousData as EventRow;

    const nextStatus =
      ACTION_STATUS[action];

    if (
      previousEvent.status ===
      nextStatus
    ) {
      return NextResponse.json({
        success: true,
        eventId:
          previousEvent.id,
        status:
          previousEvent.status,
        notification: null,
        warning: null,
      });
    }

    const {
      data: updatedData,
      error: updateError,
    } = await admin
      .from("events")
      .update({
        status: nextStatus,
      })
      .eq("id", body.eventId)
      .eq(
        "church_id",
        profile.church_id
      )
      .select(
        `
          id,
          title,
          description,
          event_date,
          start_time,
          end_time,
          location,
          status
        `
      )
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        { status: 400 }
      );
    }

    if (!updatedData) {
      return NextResponse.json(
        {
          error:
            "Événement introuvable.",
        },
        { status: 404 }
      );
    }

    const updatedEvent =
      updatedData as EventRow;

    let notification:
      | NotificationSummary
      | null = null;

    if (
      nextStatus === "active"
    ) {
      notification =
        await notifyEvent({
          event: updatedEvent,
          churchId:
            profile.church_id,
          profileId:
            profile.id,
          kind: "published",
        });
    } else if (
      nextStatus ===
        "cancelled" &&
      previousEvent.status ===
        "active"
    ) {
      notification =
        await notifyEvent({
          event: updatedEvent,
          churchId:
            profile.church_id,
          profileId:
            profile.id,
          kind: "cancelled",
        });
    }

    return NextResponse.json({
      success: true,
      eventId:
        updatedEvent.id,
      status:
        updatedEvent.status,
      notification,
      warning:
        notification?.warning ||
        null,
    });
  } catch (caughtError: unknown) {
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur pendant l’action.",
      },
      { status: 500 }
    );
  }
}