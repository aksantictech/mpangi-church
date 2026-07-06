import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ScanBody = {
  eventId?: string;
  qrValue?: string;
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractQrToken(qrValue: string) {
  const value = qrValue.trim();

  if (!value) return "";

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const memberCardIndex = parts.findIndex((part) => part === "member-card");

    if (memberCardIndex >= 0 && parts[memberCardIndex + 1]) {
      return parts[memberCardIndex + 1];
    }
  } catch {
    // Le QR peut contenir directement le token sans URL complète.
  }

  if (value.includes("/member-card/")) {
    return value.split("/member-card/")[1]?.split(/[?#]/)[0] || "";
  }

  return value;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanBody;

    const eventId = getString(body.eventId);
    const qrValue = getString(body.qrValue);
    const qrToken = extractQrToken(qrValue);

    if (!eventId || !qrToken) {
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
      .select("id, church_id, title, attendance_enabled")
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

    const { data: member } = await admin
      .from("members")
      .select(
        `
        id,
        first_name,
        last_name,
        phone,
        status,
        qr_token,
        qr_enabled
        `
      )
      .eq("church_id", profile.church_id)
      .eq("qr_token", qrToken)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable pour ce QR Code." },
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
        qr_token_snapshot: qrToken,
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
