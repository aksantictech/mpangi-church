import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ScanBody = {
  eventId?: string;
  qrValue?: string;
};

type QrIdentity = {
  qrToken: string;
  memberId: string;
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractQrIdentity(qrValue: string): QrIdentity {
  const value = qrValue.trim();

  if (!value) {
    return {
      qrToken: "",
      memberId: "",
    };
  }

  /*
   * Cas 1 : ton QR actuel contient du JSON.
   * Exemple :
   * {"type":"mpangi_church_member","member_id":"...","church_slug":"iccrdc"}
   */
  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === "object") {
      return {
        qrToken:
          getString((parsed as any).qr_token) ||
          getString((parsed as any).qrToken) ||
          getString((parsed as any).token),
        memberId:
          getString((parsed as any).member_id) ||
          getString((parsed as any).memberId) ||
          getString((parsed as any).id),
      };
    }
  } catch {
    // Le QR n'est pas du JSON, on continue avec les autres formats.
  }

  /*
   * Cas 2 : QR sous forme de lien public.
   * Exemple :
   * https://icckinshasa.mpangi-church.app/church/iccrdc/member-card/TOKEN
   */
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const memberCardIndex = parts.findIndex((part) => part === "member-card");

    if (memberCardIndex >= 0 && parts[memberCardIndex + 1]) {
      return {
        qrToken: parts[memberCardIndex + 1],
        memberId: "",
      };
    }
  } catch {
    // Le QR peut contenir directement un token brut.
  }

  if (value.includes("/member-card/")) {
    return {
      qrToken: value.split("/member-card/")[1]?.split(/[?#]/)[0] || "",
      memberId: "",
    };
  }

  /*
   * Cas 3 : token brut.
   */
  return {
    qrToken: value,
    memberId: "",
  };
}

async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      error: "Utilisateur non connecté.",
      status: 401,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      profile: null,
      error: "Profil utilisateur introuvable.",
      status: 403,
    };
  }

  if (profile.status && profile.status !== "active") {
    return {
      profile: null,
      error: "Compte désactivé.",
      status: 403,
    };
  }

  if (!profile.church_id) {
    return {
      profile: null,
      error: "Aucune église rattachée à ce compte.",
      status: 403,
    };
  }

  return {
    profile,
    error: null,
    status: 200,
  };
}

async function findMemberByQrIdentity({
  admin,
  churchId,
  memberId,
  qrToken,
}: {
  admin: ReturnType<typeof createAdminClient>;
  churchId: string;
  memberId: string;
  qrToken: string;
}) {
  const selectFields = `
    id,
    first_name,
    last_name,
    phone,
    status,
    qr_token,
    qr_enabled
  `;

  /*
   * Priorité au member_id parce que ton QR actuel contient member_id.
   */
  if (memberId) {
    const { data: memberById } = await admin
      .from("members")
      .select(selectFields)
      .eq("church_id", churchId)
      .eq("id", memberId)
      .maybeSingle();

    if (memberById) {
      return memberById;
    }
  }

  /*
   * Compatibilité avec les QR qui contiennent qr_token ou un lien member-card.
   */
  if (qrToken) {
    const { data: memberByToken } = await admin
      .from("members")
      .select(selectFields)
      .eq("church_id", churchId)
      .eq("qr_token", qrToken)
      .maybeSingle();

    if (memberByToken) {
      return memberByToken;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanBody;

    const eventId = getString(body.eventId);
    const qrValue = getString(body.qrValue);
    const { qrToken, memberId } = extractQrIdentity(qrValue);

    if (!eventId || (!qrToken && !memberId)) {
      return NextResponse.json(
        { error: "QR Code ou événement invalide." },
        { status: 400 }
      );
    }

    const { profile, error, status } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error }, { status });
    }

    const admin = createAdminClient();

    const { data: event } = await admin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("church_id", profile.church_id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable dans votre église." },
        { status: 404 }
      );
    }

    if (event.attendance_enabled === false) {
      return NextResponse.json(
        { error: "Le pointage est désactivé pour cet événement." },
        { status: 403 }
      );
    }

    const member = await findMemberByQrIdentity({
      admin,
      churchId: profile.church_id,
      memberId,
      qrToken,
    });

    if (!member) {
      return NextResponse.json(
        {
          error:
            "Membre introuvable pour ce QR Code. Le QR a bien été lu, mais son identifiant ne correspond à aucun membre de cette église.",
        },
        { status: 404 }
      );
    }

    if (member.qr_enabled === false) {
      return NextResponse.json(
        { error: "Le QR Code de ce membre est désactivé." },
        { status: 403 }
      );
    }

    if (member.status && member.status !== "actif") {
      return NextResponse.json(
        { error: "Ce membre n’est pas actif." },
        { status: 403 }
      );
    }

    const memberName =
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      "Membre";

    const { data: existingAttendance } = await admin
      .from("event_attendances")
      .select("id, check_in_at")
      .eq("church_id", profile.church_id)
      .eq("event_id", eventId)
      .eq("member_id", member.id)
      .maybeSingle();

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        status: "already_checked_in",
        message: `${memberName} est déjà pointé pour cet événement.`,
        member: {
          id: member.id,
          name: memberName,
          phone: member.phone,
        },
        checkInAt: existingAttendance.check_in_at,
      });
    }

    const { data: attendance, error: attendanceError } = await admin
      .from("event_attendances")
      .insert({
        church_id: profile.church_id,
        event_id: eventId,
        member_id: member.id,
        scanned_by: profile.id,
        status: "present",
        check_in_method: "qr",
        qr_token_snapshot: qrToken || member.qr_token || memberId,
      })
      .select("id, check_in_at")
      .single();

    if (attendanceError || !attendance) {
      return NextResponse.json(
        {
          error:
            attendanceError?.message ||
            "Impossible d’enregistrer la présence.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "checked_in",
      message: `Présence enregistrée pour ${memberName}.`,
      member: {
        id: member.id,
        name: memberName,
        phone: member.phone,
      },
      checkInAt: attendance.check_in_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant le scan." },
      { status: 500 }
    );
  }
}
