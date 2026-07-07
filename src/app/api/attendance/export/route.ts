import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getEventTitle(event: any) {
  return event.title || event.name || event.event_name || "evenement";
}

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

function getMemberCode(member: any) {
  if (member.member_code) return member.member_code;
  return `M-${String(member.id).replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function formatCsvValue(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = getString(url.searchParams.get("eventId"));

    if (!eventId) {
      return NextResponse.json(
        { error: "Événement manquant." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, church_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || !profile.church_id) {
      return NextResponse.json(
        { error: "Profil utilisateur introuvable." },
        { status: 403 }
      );
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 }
      );
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
        { error: "Événement introuvable." },
        { status: 404 }
      );
    }

    const { data: attendances } = await admin
      .from("event_attendances")
      .select("member_id, status, check_in_method, check_in_at")
      .eq("church_id", profile.church_id)
      .eq("event_id", eventId)
      .order("check_in_at", { ascending: true });

    const { data: members } = await admin
      .from("members")
      .select(
        `
        id,
        first_name,
        middle_name,
        last_name,
        phone,
        email,
        status,
        member_code
        `
      )
      .eq("church_id", profile.church_id)
      .eq("status", "actif")
      .order("last_name", { ascending: true });

    const allMembers = members ?? [];
    const memberIds = allMembers.map((member: any) => member.id);

    const { data: memberDepartments } =
      memberIds.length > 0
        ? await admin
            .from("member_departments")
            .select("member_id, department_id")
            .eq("church_id", profile.church_id)
            .in("member_id", memberIds)
        : { data: [] as any[] };

    const departmentIds = Array.from(
      new Set(
        (memberDepartments ?? [])
          .map((row: any) => row.department_id)
          .filter(Boolean)
      )
    );

    const { data: departments } =
      departmentIds.length > 0
        ? await admin
            .from("departments")
            .select("id, name")
            .eq("church_id", profile.church_id)
            .in("id", departmentIds)
        : { data: [] as any[] };

    const departmentsById = new Map(
      (departments ?? []).map((department: any) => [
        department.id,
        department.name,
      ])
    );

    const departmentsByMemberId = new Map<string, string[]>();

    for (const row of memberDepartments ?? []) {
      const departmentName = departmentsById.get(row.department_id);

      if (!departmentName) continue;

      const existing = departmentsByMemberId.get(row.member_id) ?? [];
      existing.push(departmentName);
      departmentsByMemberId.set(row.member_id, existing);
    }

    const attendanceByMemberId = new Map(
      (attendances ?? []).map((attendance: any) => [
        attendance.member_id,
        attendance,
      ])
    );

    const header = [
      "Evenement",
      "ID membre",
      "Nom complet",
      "Telephone",
      "Email",
      "Departement",
      "Statut presence",
      "Heure pointage",
      "Methode",
    ];

    const lines = [
      header.map(formatCsvValue).join(";"),
      ...allMembers.map((member: any) => {
        const attendance = attendanceByMemberId.get(member.id) as any | undefined;
        const departments =
          departmentsByMemberId.get(member.id)?.join(", ") || "Non renseigné";

        return [
          getEventTitle(event),
          getMemberCode(member),
          getMemberName(member),
          member.phone || "",
          member.email || "",
          departments,
          attendance ? "Présent" : "Absent",
          attendance ? formatDate(attendance.check_in_at) : "",
          attendance?.check_in_method || "",
        ]
          .map(formatCsvValue)
          .join(";");
      }),
    ];

    const csv = `\uFEFF${lines.join("\n")}`;
    const filename = `rapport-presence-${slugifyFileName(
      getEventTitle(event)
    )}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant l’export." },
      { status: 500 }
    );
  }
}
