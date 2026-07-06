"use client";

import Link from "next/link";
import { Download, Home, Printer, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type PublicMemberQrSuccessProps = {
  churchSlug: string;
  churchName: string;
  memberName: string;
  qrValue: string;
};

function getSafeFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PublicMemberQrSuccess({
  churchSlug,
  churchName,
  memberName,
  qrValue,
}: PublicMemberQrSuccessProps) {
  function handlePrint() {
    window.print();
  }

  function downloadQr(format: "png" | "jpg") {
    const canvas = document.getElementById(
      "member-personal-qr-code"
    ) as HTMLCanvasElement | null;

    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const context = exportCanvas.getContext("2d");

    if (!context) return;

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(canvas, 0, 0);

    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const fileExtension = format === "png" ? "png" : "jpg";

    const imageUrl = exportCanvas.toDataURL(mimeType, 1);

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `qr-code-${getSafeFileName(memberName)}.${fileExtension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-700">
        <QrCode className="h-8 w-8" />
      </div>

      <h1 className="mt-5 text-2xl font-black text-[#03357A]">
        Formulaire envoyé avec succès
      </h1>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        Votre inscription a été enregistrée. Voici votre QR Code personnel à
        conserver dans votre téléphone. Il servira pour les présences aux
        cultes, formations, réunions et événements.
      </p>

      <div className="mt-6 rounded-[2rem] border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563EB]">
          {churchName}
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-[#03357A]">
          {memberName}
        </h2>

        <div className="mx-auto mt-5 flex w-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCEAF5]">
          <QRCodeCanvas
            id="member-personal-qr-code"
            value={qrValue}
            size={900}
            level="H"
            includeMargin
            bgColor="#FFFFFF"
            fgColor="#03357A"
            className="h-[260px] w-[260px]"
          />
        </div>

        <p className="mt-4 text-xs leading-6 text-slate-500">
          Ce QR Code est personnel. Ne le partagez pas avec une autre personne.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => downloadQr("png")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 hover:bg-[#022B63]"
        >
          <Download className="h-4 w-4" />
          Télécharger en PNG
        </button>

        <button
          type="button"
          onClick={() => downloadQr("jpg")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5] hover:bg-[#F8FBFD]"
        >
          <Download className="h-4 w-4" />
          Télécharger en JPG
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#DCEAF5]"
        >
          <Printer className="h-4 w-4" />
          Imprimer / enregistrer
        </button>

        <a
          href={qrValue}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#F8FBFD]"
        >
          <QrCode className="h-4 w-4" />
          Ouvrir ma carte QR
        </a>

        <Link
          href={`/church/${churchSlug}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#F8FBFD]"
        >
          <Home className="h-4 w-4" />
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}