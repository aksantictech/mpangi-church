import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AttendanceActionBody = {
  eventId?: string;
  memberId?: string;
  action?: "mark_present" | "remove";
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

function getMemberName(member: any) {
  return (
    [member.first_name, member.middle_name, member.last_name]
      .filter(Boolean)
      .join(" ") || "Membre"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AttendanceActionBody;

    const eventId = getString(body.eventId);
    const memberId = getString(body.memberId);
    const action = body.action;

    if (!eventId || !memberId || !action) {
      return NextResponse.json(
        { error: "Événement, membre ou action manquant." },
        { status: 400 }
      );
    }

    if (!["mark_present", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Action de présence invalide." },
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
      .select("id, first_name, middle_name, last_name, status, qr_token")
      .eq("id", memberId)
      .eq("church_id", profile.church_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable dans votre église." },
        { status: 404 }
      );
    }

    if (member.status && member.status !== "actif") {
      return NextResponse.json(
        { error: "Ce membre n’est pas actif." },
        { status: 403 }
      );
    }

    const memberName = getMemberName(member);

    if (action === "remove") {
      const { error: deleteError } = await admin
        .from("event_attendances")
        .delete()
        .eq("church_id", profile.church_id)
        .eq("event_id", eventId)
        .eq("member_id", memberId);

      if (deleteError) {
        return NextResponse.json(
          {
            error:
              deleteError.message ||
              "Impossible de retirer la présence du membre.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "removed",
        message: `Présence retirée pour ${memberName}.`,
      });
    }

    const { data: existingAttendance } = await admin
      .from("event_attendances")
      .select("id, check_in_at")
      .eq("church_id", profile.church_id)
      .eq("event_id", eventId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        status: "already_checked_in",
        message: `${memberName} est déjà pointé pour cet événement.`,
        checkInAt: existingAttendance.check_in_at,
      });
    }

    const { data: attendance, error: insertError } = await admin
      .from("event_attendances")
      .insert({
        church_id: profile.church_id,
        event_id: eventId,
        member_id: memberId,
        scanned_by: profile.id,
        status: "present",
        check_in_method: "manual",
        qr_token_snapshot: member.qr_token || `manual:${member.id}`,
      })
      .select("id, check_in_at")
      .single();

    if (insertError || !attendance) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Impossible d’enregistrer la présence manuelle.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "checked_in",
      message: `Présence manuelle enregistrée pour ${memberName}.`,
      checkInAt: attendance.check_in_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant l’action de présence." },
      { status: 500 }
    );
  }
}
