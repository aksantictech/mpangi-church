"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronRight,
  Filter,
  Mail,
  Phone,
  Search,
  SlidersHorizontal,
  UserCircle,
  UsersRound,
} from "lucide-react";
import MemberRowActions from "@/components/members/MemberRowActions";
import { getMemberStatusLabel, getMemberTypeLabel } from "@/lib/members/memberLabels";

export type MemberDirectoryItem = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  memberType: string | null;
  status: string | null;
  createdAt: string;
  archivedAt: string | null;
  departmentNames: string[];
  lastAttendanceAt: string | null;
  attendanceCount90Days: number;
  profileCompleteness: number;
};

type MemberDirectoryProps = {
  members: MemberDirectoryItem[];
  initialStatus?: string;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isDepartmentResponsible: boolean;
};

const STATUS_OPTIONS = [
  ["all", "Tous"],
  ["actif", "Actifs"],
  ["nouveau", "Nouveaux"],
  ["en_suivi", "En suivi"],
  ["a_suivre", "À suivre"],
  ["irregulier", "Irréguliers"],
  ["inactif", "Inactifs"],
  ["en_attente", "À valider"],
] as const;

function normalize(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getName(member: MemberDirectoryItem) {
  return [member.firstName, member.middleName, member.lastName]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "Aucune présence";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusClass(status?: string | null) {
  if (["actif", "active", "integre"].includes(status || "")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
  }
  if (["nouveau", "en_attente"].includes(status || "")) {
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  }
  if (["a_suivre", "en_suivi", "irregulier"].includes(status || "")) {
    return "bg-orange-50 text-orange-700 ring-orange-600/15";
  }
  return "bg-slate-100 text-slate-600 ring-slate-500/15";
}

function MemberAvatar({ member, size = "md" }: { member: MemberDirectoryItem; size?: "md" | "lg" }) {
  const name = getName(member);
  const sizeClass = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#E8F1FB] font-black text-[#0A3B73]`}>
      {member.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <UserCircle className={size === "lg" ? "h-8 w-8" : "h-6 w-6"} />
      )}
    </div>
  );
}

export default function MemberDirectory({
  members,
  initialStatus,
  canUpdate,
  canDelete,
  canApprove,
  isDepartmentResponsible,
}: MemberDirectoryProps) {
  const normalizedInitialStatus = STATUS_OPTIONS.some(([value]) => value === initialStatus)
    ? initialStatus || "all"
    : "all";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(normalizedInitialStatus);
  const [type, setType] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const memberTypes = useMemo(
    () => [...new Set(members.map((member) => member.memberType).filter(Boolean) as string[])].sort(),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const needle = normalize(deferredQuery.trim());
    return members.filter((member) => {
      if (status !== "all" && member.status !== status) return false;
      if (type !== "all" && member.memberType !== type) return false;
      if (!needle) return true;
      const haystack = normalize(
        [
          getName(member),
          member.phone,
          member.email,
          member.memberType,
          member.status,
          ...member.departmentNames,
        ]
          .filter(Boolean)
          .join(" ")
      );
      return haystack.includes(needle);
    });
  }, [deferredQuery, members, status, type]);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2F6FA9]">Répertoire central</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Dossiers des membres</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredMembers.length} dossier{filteredMembers.length > 1 ? "s" : ""} affiché{filteredMembers.length > 1 ? "s" : ""}
              {isDepartmentResponsible ? " dans votre périmètre" : " dans l’église"}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] xl:w-[620px]">
            <label className="relative block">
              <span className="sr-only">Rechercher un membre</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, téléphone, email, département…"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base outline-none transition focus:border-[#15558F] focus:bg-white focus:ring-4 focus:ring-blue-900/10"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Filtrer par type de membre</span>
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#15558F] focus:ring-4 focus:ring-blue-900/10"
              >
                <option value="all">Tous les profils</option>
                {memberTypes.map((memberType) => (
                  <option key={memberType} value={memberType}>{getMemberTypeLabel(memberType)}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer les membres par statut">
          {STATUS_OPTIONS.map(([value, label]) => {
            const count = value === "all" ? members.length : members.filter((member) => member.status === value).length;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-extrabold transition ${
                  status === value ? "bg-[#0A3B73] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${status === value ? "bg-white/15" : "bg-white"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Filter className="h-6 w-6" /></div>
          <h3 className="mt-4 font-black text-slate-900">Aucun dossier ne correspond</h3>
          <p className="mt-1 text-sm text-slate-500">Modifiez la recherche ou retirez un filtre.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
            {filteredMembers.map((member) => (
              <article key={member.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-3">
                  <MemberAvatar member={member} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-slate-950">{getName(member) || "Nom non renseigné"}</h3>
                        <p className="mt-0.5 text-sm font-semibold text-slate-500">{getMemberTypeLabel(member.memberType)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset ${getStatusClass(member.status)}`}>
                        {getMemberStatusLabel(member.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.departmentNames.length > 0 ? member.departmentNames.slice(0, 2).map((name) => (
                        <span key={name} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-[#15558F]">{name}</span>
                      )) : <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">Non affecté</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Dernière présence</p>
                    <p className="mt-1 font-bold text-slate-700">{formatDate(member.lastAttendanceAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Dossier</p>
                    <p className="mt-1 font-bold text-slate-700">{member.profileCompleteness}% complété</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {canUpdate || canDelete || canApprove ? (
                    <MemberRowActions memberId={member.id} memberName={getName(member)} status={member.status} archivedAt={member.archivedAt} canUpdate={canUpdate} canDelete={canDelete} canApprove={canApprove} />
                  ) : (
                    <Link href={`/members/${member.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0A3B73] px-4 text-sm font-black text-white">
                      Ouvrir le dossier <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Membre</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Affectation</th>
                  <th className="px-5 py-4">Engagement</th>
                  <th className="px-5 py-4">Dossier</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={member} />
                        <div className="min-w-0">
                          <Link href={`/members/${member.id}`} className="font-black text-slate-900 hover:text-[#15558F]">{getName(member) || "Nom non renseigné"}</Link>
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500"><BriefcaseBusiness className="h-3.5 w-3.5" /> {getMemberTypeLabel(member.memberType)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="flex items-center gap-2 font-semibold"><Phone className="h-4 w-4 text-slate-400" />{member.phone || "Non renseigné"}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs"><Mail className="h-4 w-4 text-slate-400" />{member.email || "Aucun email"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {member.departmentNames.length > 0 ? (
                        <div className="flex max-w-[220px] flex-wrap gap-1.5">{member.departmentNames.slice(0, 2).map((name) => <span key={name} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-[#15558F]">{name}</span>)}</div>
                      ) : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><UsersRound className="h-4 w-4" /> Non affecté</span>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-2 font-bold text-slate-700"><CalendarCheck2 className="h-4 w-4 text-emerald-600" />{member.attendanceCount90Days} présence{member.attendanceCount90Days > 1 ? "s" : ""} / 90 j</p>
                      <p className="mt-1 text-xs text-slate-500">Dernière : {formatDate(member.lastAttendanceAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Complétude</span><span>{member.profileCompleteness}%</span></div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2F6FA9]" style={{ width: `${member.profileCompleteness}%` }} /></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset ${getStatusClass(member.status)}`}>{getMemberStatusLabel(member.status)}</span></td>
                    <td className="px-5 py-4"><div className="flex justify-end">{canUpdate || canDelete || canApprove ? <MemberRowActions memberId={member.id} memberName={getName(member)} status={member.status} archivedAt={member.archivedAt} canUpdate={canUpdate} canDelete={canDelete} canApprove={canApprove} /> : <Link href={`/members/${member.id}`} className="rounded-xl bg-blue-50 px-4 py-2 font-black text-[#15558F]">Voir</Link>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
