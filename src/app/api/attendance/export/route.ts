import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getMethodLabel(method?: string | null) {
  if (method === "qr") return "QR Code";
  if (method === "manual") return "Manuel";
  return method || "";
}

export async function GET(request: Request) {
  await requireAnyModulePermission(["attendance"], "view");
  try {
    const url = new URL(request.url);
    const eventId = getString(url.searchParams.get("eventId"));
    const view = getString(url.searchParams.get("view")) || "all";
    const query = getString(url.searchParams.get("q"));
    const selectedDepartmentId = getString(url.searchParams.get("departmentId"));

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
    const departmentIdsByMemberId = new Map<string, string[]>();

    for (const row of memberDepartments ?? []) {
      const departmentName = departmentsById.get(row.department_id);

      if (!departmentName) continue;

      const existingNames = departmentsByMemberId.get(row.member_id) ?? [];
      existingNames.push(departmentName);
      departmentsByMemberId.set(row.member_id, existingNames);

      const existingIds = departmentIdsByMemberId.get(row.member_id) ?? [];
      existingIds.push(row.department_id);
      departmentIdsByMemberId.set(row.member_id, existingIds);
    }

    const attendanceByMemberId = new Map(
      (attendances ?? []).map((attendance: any) => [
        attendance.member_id,
        attendance,
      ])
    );

    let reportRows = allMembers.map((member: any) => {
      const attendance = attendanceByMemberId.get(member.id) as any | undefined;
      const departments =
        departmentsByMemberId.get(member.id)?.join(", ") || "Non renseigné";
      const memberDepartmentIds = departmentIdsByMemberId.get(member.id) ?? [];
      const fullName = getMemberName(member);

      return {
        member,
        fullName,
        departments,
        memberDepartmentIds,
        attendance,
        isPresent: Boolean(attendance),
      };
    });

    if (selectedDepartmentId) {
      reportRows = reportRows.filter((row) =>
        row.memberDepartmentIds.includes(selectedDepartmentId)
      );
    }

    if (view === "present") {
      reportRows = reportRows.filter((row) => row.isPresent);
    }

    if (view === "absent") {
      reportRows = reportRows.filter((row) => !row.isPresent);
    }

    if (query) {
      const normalizedQuery = normalizeText(query);

      reportRows = reportRows.filter((row) => {
        const searchable = normalizeText(
          [
            row.fullName,
            getMemberCode(row.member),
            row.member.phone || "",
            row.member.email || "",
            row.departments,
          ].join(" ")
        );

        return searchable.includes(normalizedQuery);
      });
    }

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
      ...reportRows.map((row) => {
        return [
          getEventTitle(event),
          getMemberCode(row.member),
          row.fullName,
          row.member.phone || "",
          row.member.email || "",
          row.departments,
          row.attendance ? "Présent" : "Absent",
          row.attendance ? formatDate(row.attendance.check_in_at) : "",
          getMethodLabel(row.attendance?.check_in_method),
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
