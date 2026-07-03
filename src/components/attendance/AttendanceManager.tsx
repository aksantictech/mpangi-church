"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type AttendanceEvent = {
  id: string;
  church_id: string;
  title: string;
  event_date: string | null;
  start_date: string | null;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  phone: string | null;
  member_type: string;
  status: string;
  photo_url: string | null;
};

type ExistingAttendance = {
  id: string;
  member_id: string;
  status: AttendanceStatus;
  checked_in_at: string | null;
};

type AttendanceManagerProps = {
  event: AttendanceEvent;
  members: Member[];
  existingAttendances: ExistingAttendance[];
  profileId: string;
};

const statusConfig: Record<
  AttendanceStatus,
  {
    label: string;
    icon: React.ElementType;
    buttonClass: string;
    badgeClass: string;
  }
> = {
  present: {
    label: "Présent",
    icon: UserCheck,
    buttonClass: "bg-green-50 text-green-700 hover:bg-green-100",
    badgeClass: "bg-green-50 text-green-700",
  },
  absent: {
    label: "Absent",
    icon: UserX,
    buttonClass: "bg-red-50 text-red-700 hover:bg-red-100",
    badgeClass: "bg-red-50 text-red-700",
  },
  late: {
    label: "Retard",
    icon: Clock3,
    buttonClass: "bg-orange-50 text-orange-700 hover:bg-orange-100",
    badgeClass: "bg-orange-50 text-orange-700",
  },
  excused: {
    label: "Excusé",
    icon: ShieldAlert,
    buttonClass: "bg-[#F1E8FF] text-[#8B5CF6] hover:bg-purple-100",
    badgeClass: "bg-[#F1E8FF] text-[#8B5CF6]",
  },
};

function getFullName(member: Member) {
  return [member.first_name, member.last_name, member.middle_name]
    .filter(Boolean)
    .join(" ");
}

export default function AttendanceManager({
  event,
  members,
  existingAttendances,
  profileId,
}: AttendanceManagerProps) {
  const supabase = useMemo(() => createClient(), []);

  const initialMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();

    existingAttendances.forEach((attendance) => {
      map.set(attendance.member_id, attendance.status);
    });

    return map;
  }, [existingAttendances]);

  const [attendanceMap, setAttendanceMap] =
    useState<Map<string, AttendanceStatus>>(initialMap);

  const [search, setSearch] = useState("");
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredMembers = members.filter((member) => {
    const value = `${member.first_name} ${member.last_name} ${
      member.middle_name ?? ""
    } ${member.phone ?? ""}`.toLowerCase();

    return value.includes(search.toLowerCase());
  });

  const counters = {
    present: Array.from(attendanceMap.values()).filter(
      (status) => status === "present"
    ).length,
    absent: Array.from(attendanceMap.values()).filter(
      (status) => status === "absent"
    ).length,
    late: Array.from(attendanceMap.values()).filter(
      (status) => status === "late"
    ).length,
    excused: Array.from(attendanceMap.values()).filter(
      (status) => status === "excused"
    ).length,
  };

  async function markAttendance(memberId: string, status: AttendanceStatus) {
    setErrorMessage("");
    setLoadingMemberId(memberId);

    const attendanceDate =
      event.event_date ?? event.start_date?.slice(0, 10) ?? null;

    const checkedInAt =
      status === "present" || status === "late"
        ? new Date().toISOString()
        : null;

    const { error } = await supabase.from("attendances").upsert(
      {
        church_id: event.church_id,
        event_id: event.id,
        member_id: memberId,
        attendance_date: attendanceDate,
        status,
        checkin_method: "manual",
        checked_in_at: checkedInAt,
        created_by: profileId,
      },
      {
        onConflict: "event_id,member_id",
      }
    );

    setLoadingMemberId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setAttendanceMap((current) => {
      const next = new Map(current);
      next.set(memberId, status);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <CounterCard
          label="Présents"
          value={counters.present}
          className="bg-green-50 text-green-700"
        />

        <CounterCard
          label="Absents"
          value={counters.absent}
          className="bg-red-50 text-red-700"
        />

        <CounterCard
          label="Retards"
          value={counters.late}
          className="bg-orange-50 text-orange-700"
        />

        <CounterCard
          label="Excusés"
          value={counters.excused}
          className="bg-[#F1E8FF] text-[#8B5CF6]"
        />
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Liste des membres
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Cliquez sur un bouton pour enregistrer la présence du membre.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              placeholder="Rechercher un membre..."
              className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filteredMembers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#C9DBEA] bg-[#F8FBFD] p-8 text-center text-slate-500">
              Aucun membre trouvé.
            </div>
          )}

          {filteredMembers.map((member) => {
            const fullName = getFullName(member);
            const currentStatus = attendanceMap.get(member.id);
            const currentConfig = currentStatus
              ? statusConfig[currentStatus]
              : null;

            return (
              <article
                key={member.id}
                className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF3FA] text-sm font-extrabold text-[#03357A]">
                      {member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo_url}
                          alt={fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        fullName.charAt(0)
                      )}
                    </div>

                    <div>
                      <p className="font-extrabold text-slate-800">
                        {fullName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {member.member_type}{" "}
                        {member.phone ? `• ${member.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                    {currentConfig && (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold ${currentConfig.badgeClass}`}
                      >
                        {currentConfig.label}
                      </span>
                    )}

                    <div className="grid grid-cols-2 gap-2 md:flex">
                      {(Object.keys(statusConfig) as AttendanceStatus[]).map(
                        (status) => {
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          const isLoading = loadingMemberId === member.id;

                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={isLoading}
                              onClick={() => markAttendance(member.id, status)}
                              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${config.buttonClass}`}
                            >
                              <Icon className="h-4 w-4" />
                              {isLoading ? "..." : config.label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CounterCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${className}`}
      >
        <CheckCircle2 className="h-6 w-6" />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-[#03357A]">{value}</p>
    </div>
  );
}