"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  Building2,
  Download,
  IdCard,
  Printer,
  QrCode,
  ShieldCheck,
} from "lucide-react";

type MemberCardPrintProps = {
  church: {
    name: string;
    publicName: string;
    logoUrl: string | null;
    slug: string;
  };
  member: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    photoUrl: string | null;
    phone: string | null;
    status: string | null;
    memberCode: string;
    qrToken: string | null;
  };
  departmentName: string;
  qrValue: string;
};

function getFullName(member: MemberCardPrintProps["member"]) {
  return [member.firstName, member.middleName, member.lastName]
    .filter(Boolean)
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function MemberCardPrint({
  church,
  member,
  departmentName,
  qrValue,
}: MemberCardPrintProps) {
  const fullName = getFullName(member);
  const initials = getInitials(fullName);
  const churchName = church.publicName || church.name;

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          body * { visibility: hidden !important; }
          .member-card-print-zone, .member-card-print-zone * { visibility: visible !important; }
          .member-card-print-zone {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          .print-card-sheet {
            min-height: auto !important;
            padding: 18mm !important;
            box-shadow: none !important;
            background: white !important;
            border: none !important;
          }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="no-print flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <IdCard className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-[#03357A]">
                Carte de membre prête à imprimer
              </h2>
              <p className="text-sm text-slate-500">
                Utilisez le bouton imprimer puis choisissez “Enregistrer en PDF”
                ou votre imprimante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20"
          >
            <Printer className="h-4 w-4" />
            Imprimer la carte
          </button>
        </div>

        <div className="member-card-print-zone">
          <div className="print-card-sheet rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
              <article className="relative overflow-hidden rounded-[28px] border border-[#DCEAF5] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/20">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white">
                      {church.logoUrl ? (
                        <Image
                          src={church.logoUrl}
                          alt={churchName}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-7 w-7 text-[#03357A]" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">
                        Carte de membre
                      </p>
                      <h3 className="mt-1 text-base font-black leading-tight">
                        {churchName}
                      </h3>
                    </div>
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold ring-1 ring-white/20">
                    ACTIF
                  </span>
                </div>

                <div className="relative mt-7 flex items-center gap-5">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-white/15 ring-4 ring-white/25">
                    {member.photoUrl ? (
                      <Image
                        src={member.photoUrl}
                        alt={fullName}
                        width={160}
                        height={160}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-black">{initials}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                      Nom complet
                    </p>
                    <h1 className="mt-2 text-2xl font-black leading-tight">
                      {fullName}
                    </h1>

                    <div className="mt-4 space-y-2 text-sm font-semibold text-blue-50">
                      <p>
                        Département :{" "}
                        <span className="font-black text-white">
                          {departmentName || "Non renseigné"}
                        </span>
                      </p>
                      <p>
                        ID personnel :{" "}
                        <span className="font-black text-white">
                          {member.memberCode}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                      Statut
                    </p>
                    <p className="mt-1 text-sm font-black">
                      {member.status || "actif"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                      Téléphone
                    </p>
                    <p className="mt-1 truncate text-sm font-black">
                      {member.phone || "Non renseigné"}
                    </p>
                  </div>
                </div>
              </article>

              <article className="relative overflow-hidden rounded-[28px] border border-[#DCEAF5] bg-white p-5 shadow-xl shadow-slate-200/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3F79B3]">
                      Identification QR
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#03357A]">
                      {fullName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {churchName}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                    <QrCode className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center rounded-[28px] bg-[#F8FBFD] p-6">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <QRCodeSVG value={qrValue} size={210} level="H" />
                  </div>

                  <p className="mt-4 text-center text-sm font-bold text-[#03357A]">
                    Présenter cette carte lors des présences, formations et
                    activités de l’église.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl border border-[#DCEAF5] bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      ID personnel
                    </p>
                    <p className="mt-1 font-black text-[#03357A]">
                      {member.memberCode}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#DCEAF5] bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Département
                    </p>
                    <p className="mt-1 font-black text-[#03357A]">
                      {departmentName || "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-green-800">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-xs font-bold leading-5">
                    Cette carte est personnelle. Le QR Code permet
                    l’identification rapide du membre dans Mpangi-church.
                  </p>
                </div>
              </article>
            </div>

            <div className="no-print mt-6 rounded-2xl bg-[#F8FBFD] p-4 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#03357A]" />
                <p>
                  Pour télécharger en PDF : cliquez sur{" "}
                  <strong>Imprimer la carte</strong>, puis choisissez{" "}
                  <strong>Enregistrer en PDF</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
