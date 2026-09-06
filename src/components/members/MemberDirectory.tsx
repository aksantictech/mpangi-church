"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarCheck2,
  ChevronRight,
  Filter,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  UserCircle,
} from "lucide-react";
import MemberRowActions from "@/components/members/MemberRowActions";
import { getDiscipleshipStageLabel, getFamilyRoleLabel, getMemberStatusLabel, getMemberTypeLabel } from "@/lib/members/memberLabels";

export type MemberDirectoryItem = {
  id: string;
  firstName: string;
  preferredName: string | null;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  photoUrl: string | null;
  memberType: string | null;
  status: string | null;
  createdAt: string;
  archivedAt: string | null;
  familyName: string | null;
  familyRole: string | null;
  discipleshipStage: string | null;
  smallGroup: string | null;
  departmentNames: string[];
  lastAttendanceAt: string | null;
  attendanceCount90Days: number;
  trainingCount: number;
  completedTrainingCount: number;
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
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getName(member: MemberDirectoryItem) {
  return [member.firstName, member.middleName, member.lastName].filter(Boolean).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "Aucune";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getStatusClass(status?: string | null) {
  if (["actif", "active", "integre"].includes(status || "")) return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
  if (["nouveau", "en_attente"].includes(status || "")) return "bg-amber-50 text-amber-800 ring-amber-600/20";
  if (["a_suivre", "en_suivi", "irregulier"].includes(status || "")) return "bg-orange-50 text-orange-700 ring-orange-600/15";
  return "bg-slate-100 text-slate-600 ring-slate-500/15";
}

export default function MemberDirectory({ members, initialStatus, canUpdate, canDelete, canApprove, isDepartmentResponsible }: MemberDirectoryProps) {
  const normalizedInitialStatus = STATUS_OPTIONS.some(([value]) => value === initialStatus) ? initialStatus || "all" : "all";
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
      return normalize([
        getName(member), member.preferredName, member.phone, member.email, member.city,
        member.memberType, member.status, member.familyName, member.discipleshipStage,
        member.smallGroup, ...member.departmentNames,
      ].filter(Boolean).join(" ")).includes(needle);
    });
  }, [deferredQuery, members, status, type]);

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2F6FA9]">Vue équipe</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Cartes des membres</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredMembers.length} personne{filteredMembers.length > 1 ? "s" : ""}{isDepartmentResponsible ? " dans votre périmètre" : " dans l’église"}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] xl:w-[620px]">
            <label className="relative block">
              <span className="sr-only">Rechercher un membre</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, famille, groupe, département…" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base outline-none transition focus:border-[#15558F] focus:bg-white focus:ring-4 focus:ring-blue-900/10" />
            </label>
            <label className="relative block">
              <span className="sr-only">Filtrer par profil</span>
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={type} onChange={(event) => setType(event.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#15558F] focus:ring-4 focus:ring-blue-900/10">
                <option value="all">Tous les profils</option>
                {memberTypes.map((memberType) => <option key={memberType} value={memberType}>{getMemberTypeLabel(memberType)}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer les membres par statut">
          {STATUS_OPTIONS.map(([value, label]) => {
            const count = value === "all" ? members.length : members.filter((member) => member.status === value).length;
            return <button key={value} type="button" onClick={() => setStatus(value)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-extrabold transition ${status === value ? "bg-[#0A3B73] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {label}<span className={`rounded-full px-2 py-0.5 text-xs ${status === value ? "bg-white/15" : "bg-white"}`}>{count}</span>
            </button>;
          })}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Filter className="h-6 w-6" /></div>
          <h3 className="mt-4 font-black text-slate-900">Aucun membre ne correspond</h3>
          <p className="mt-1 text-sm text-slate-500">Modifiez la recherche ou retirez un filtre.</p>
        </div>
      ) : (
        <div className="member-directory-grid p-3 sm:p-5">
          {filteredMembers.map((member) => {
            const memberName = getName(member) || "Nom non renseigné";
            const hasContact = Boolean(member.phone || member.email || member.city);
            return (
              <article key={member.id} className="group relative flex min-w-0 flex-col overflow-visible rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.09)] sm:p-5">
                <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-[#0A3B73] via-[#2F6FA9] to-[#55A6C8]" />
                <header className="flex min-w-0 items-start gap-3 pt-1 sm:gap-4">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF3FA] text-[#0A3B73] ring-1 ring-slate-200 sm:h-20 sm:w-20">
                    {member.photoUrl ? <img src={member.photoUrl} alt={memberName} className="h-full w-full object-cover" /> : <UserCircle className="h-10 w-10" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link href={`/members/${member.id}`} className="line-clamp-2 text-lg font-black leading-tight text-slate-950 transition hover:text-[#15558F]" title={memberName}>{memberName}</Link>
                        {member.preferredName && <p className="mt-1 text-xs font-bold text-slate-400">Appelé(e) {member.preferredName}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset ${getStatusClass(member.status)}`}>{getMemberStatusLabel(member.status)}</span>
                    </div>
                    <p className="mt-2 text-sm font-black text-[#2F6FA9]">{getMemberTypeLabel(member.memberType)}</p>
                  </div>
                </header>

                <div className="mt-4 flex flex-wrap gap-2">
                  {member.familyName ? <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700"><HeartHandshake className="h-3.5 w-3.5" />{member.familyName}{member.familyRole ? ` · ${getFamilyRoleLabel(member.familyRole)}` : ""}</span> : <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">Famille à renseigner</span>}
                  {member.smallGroup && <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700">Groupe · {member.smallGroup}</span>}
                </div>

                <div className="mt-5 grid min-h-[52px] gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  {member.phone && <ContactLine icon={Phone} value={member.phone} href={`tel:${member.phone}`} />}
                  {member.email && <ContactLine icon={Mail} value={member.email} href={`mailto:${member.email}`} />}
                  {member.city && <ContactLine icon={MapPin} value={member.city} />}
                  {!hasContact && <p className="flex items-center gap-2 text-sm font-semibold text-slate-400"><Phone className="h-4 w-4" /> Coordonnées à compléter</p>}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Parcours dans l’église</p>
                    <span className="text-right text-xs font-black text-[#15558F]">{getDiscipleshipStageLabel(member.discipleshipStage)}</span>
                  </div>
                  <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
                    {member.departmentNames.length ? member.departmentNames.slice(0, 3).map((name) => <span key={name} className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#15558F]">{name}</span>) : <span className="text-xs font-semibold text-slate-400">Aucun département de service</span>}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <CardMetric icon={CalendarCheck2} value={String(member.attendanceCount90Days)} label="Présences · 90 jours" detail={formatDate(member.lastAttendanceAt)} />
                  <CardMetric icon={BookOpenCheck} value={`${member.completedTrainingCount}/${member.trainingCount}`} label="Formations terminées" detail={member.trainingCount ? "Parcours suivi" : "Aucune inscription"} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500">Complétude du dossier</span><span className="font-black text-slate-800">{member.profileCompleteness}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#2F6FA9] to-[#55A6C8]" style={{ width: `${member.profileCompleteness}%` }} /></div>
                </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                    {canUpdate || canDelete || canApprove ? (
                      <MemberRowActions memberId={member.id} memberName={memberName} status={member.status} archivedAt={member.archivedAt} canUpdate={canUpdate} canDelete={canDelete} canApprove={canApprove} variant="card" />
                    ) : (
                      <Link href={`/members/${member.id}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0A3B73] px-4 text-sm font-black text-white">Ouvrir le dossier <ChevronRight className="h-4 w-4" /></Link>
                    )}
                  </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CardMetric({ icon: Icon, value, label, detail }: { icon: React.ElementType; value: string; label: string; detail: string }) {
  return <div className="min-w-0 rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#2F6FA9] shadow-sm"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-base font-black text-slate-900">{value}</p><p className="truncate text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p></div></div><p className="mt-2 truncate text-xs font-semibold text-slate-500">{detail}</p></div>;
}

function ContactLine({ icon: Icon, value, href }: { icon: React.ElementType; value: string; href?: string }) {
  const content = <><Icon className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 break-words font-semibold">{value}</span></>;
  return href ? <a href={href} className="flex min-w-0 items-start gap-2 transition hover:text-[#15558F]">{content}</a> : <p className="flex min-w-0 items-start gap-2">{content}</p>;
}
