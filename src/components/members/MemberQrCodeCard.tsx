"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode } from "lucide-react";

type MemberQrCodeCardProps = {
  memberId: string;
  memberName: string;
  churchName: string;
  qrValue: string;
};

export default function MemberQrCodeCard({
  memberId,
  memberName,
  churchName,
  qrValue,
}: MemberQrCodeCardProps) {
  function handleDownload() {
    const canvas = document.getElementById("member-qr-code") as HTMLCanvasElement;

    if (!canvas) return;

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = image;
    link.download = `qr-code-${memberName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  }

  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
        <QrCode className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-extrabold text-[#03357A]">
        QR Code membre
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Ce QR Code permet d’identifier rapidement le membre lors des présences.
      </p>

      <div className="mt-6 inline-flex rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <QRCodeCanvas
          id="member-qr-code"
          value={qrValue}
          size={260}
          level="H"
          includeMargin
        />
      </div>

      <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-4 text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Membre
        </p>

        <p className="mt-1 font-extrabold text-[#03357A]">{memberName}</p>

        <p className="mt-1 text-sm text-slate-500">{churchName}</p>

        <p className="mt-3 break-all text-xs text-slate-400">
          ID : {memberId}
        </p>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20"
      >
        <Download className="h-4 w-4" />
        Télécharger le QR Code
      </button>
    </div>
  );
}