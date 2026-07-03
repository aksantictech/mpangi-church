"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
  UserCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  photo_url: string | null;
  status: string | null;
};

type AttendanceRecord = {
  id: string;
  member_id: string | null;
  status: string | null;
  check_in_time: string | null;
  method: string | null;
  created_at: string | null;
};

type AttendanceManualManagerProps = {
  churchId: string;
  profileId: string;
  eventId: string;
  attendanceDate: string;
  members: Member[];
  records: AttendanceRecord[];
};

function getMemberName(member: Member) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AttendanceManualManager({
  churchId,
  profileId,
  eventId,
  attendanceDate,
  members,
  records,
}: AttendanceManualManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  const recordsByMemberId = new Map(
    records
      .filter((record) => record.member_id)
      .map((record) => [record.member_id as string, record])
  );

  const filteredMembers = members.filter((member) => {
    const name = getMemberName(member).toLowerCase();
    const phone = member.phone?.toLowerCase() || "";
    const search = query.toLowerCase().trim();

    if (!search) return true;

    return name.includes(search) || phone.includes(search);
  });

  async function handleMarkPresent(memberId: string) {
    setLoadingMemberId(memberId);

    const existingRecord = recordsByMemberId.get(memberId);
    const now = new Date().toISOString();

    if (existingRecord) {
      const { error } = await supabase
        .from("attendances")
        .update({
          status: "present",
          check_in_time: now,
          method: "manual",
        })
        .eq("id", existingRecord.id)
        .eq("church_id", churchId)
        .eq("event_id", eventId)
        .eq("member_id", memberId);

      setLoadingMemberId(null);

      if (error) {
        alert(error.message);
        return;
      }

      router.refresh();
      return;
    }

    const { error } = await supabase.from("attendances").insert({
      church_id: churchId,
      event_id: eventId,
      member_id: memberId,
      attendance_date: attendanceDate,
      check_in_time: now,
      status: "present",
      method: "manual",
      created_by: profileId,
    });

    setLoadingMemberId(null);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  async function handleRemove(recordId: string, memberId: string) {
    const confirmed = window.confirm(
      "Voulez-vous retirer cette présence ?"
    );

    if (!confirmed) return;

    setLoadingMemberId(memberId);

    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", recordId)
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .eq("member_id", memberId);

    setLoadingMemberId(null);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-extrabold text-[#03357A]">
            Pointage manuel
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sélectionnez les membres présents à cet événement.
          </p>
        </div>

        <div className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-bold text-[#03357A]">
          Présents : {records.length} / {members.length}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Rechercher un membre..."
            className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          />
        </div>

        <Link
          href="/members/new"
          className="inline-flex items-center justify-center rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          Ajouter un membre
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-[#EAF3FA] text-[#03357A]">
            <tr>
              <th className="px-4 py-3">Membre</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Statut présence</th>
              <th className="px-4 py-3">Heure</th>
              <th className="px-4 py-3">Méthode</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#DCEAF5] bg-white">
            {filteredMembers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Aucun membre trouvé.
                </td>
              </tr>
            )}

            {filteredMembers.map((member) => {
              const name = getMemberName(member) || "Nom non renseigné";
              const record = recordsByMemberId.get(member.id);
              const isLoading = loadingMemberId === member.id;

              return (
                <tr key={member.id} className="hover:bg-[#F8FBFD]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] font-bold text-[#03357A]">
                        {member.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photo_url}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-6 w-6" />
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-slate-800">{name}</p>
                        <p className="text-xs text-slate-400">
                          ID : {member.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {member.phone || "-"}
                  </td>

                  <td className="px-4 py-4">
                    {record ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                        Présent
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Non pointé
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatTime(record?.check_in_time || record?.created_at)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {record?.method || "-"}
                  </td>

                  <td className="px-4 py-4">
                    {record ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(record.id, member.id)
                        }
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Retirer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkPresent(member.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Présent
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}