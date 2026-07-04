"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

type MemberRegistrationLinkCardProps = {
  church: {
    slug: string | null;
    member_form_enabled: boolean | null;
    member_form_token: string | null;
  };
};

export default function MemberRegistrationLinkCard({
  church,
}: MemberRegistrationLinkCardProps) {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);

    if (!church.slug || !church.member_form_token) {
      setRegistrationUrl("");
      return;
    }

    setRegistrationUrl(
      `${window.location.origin}/church/${church.slug}/member-registration?token=${church.member_form_token}`
    );
  }, [church.slug, church.member_form_token]);

  async function copyLink() {
    if (!registrationUrl) return;

    try {
      await navigator.clipboard.writeText(registrationUrl);
      setMessage("Lien copié.");
    } catch {
      setMessage("Impossible de copier automatiquement. Copiez le lien manuellement.");
    }
  }

  function downloadQrCode() {
    const canvas = document.getElementById(
      "member-registration-qr"
    ) as HTMLCanvasElement | null;

    if (!canvas) return;

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = image;
    link.download = "qr-code-formulaire-membre.png";
    link.click();
  }

  async function updateSettings(action: "toggle" | "regenerate") {
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/settings/member-registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        action === "toggle"
          ? {
              action,
              enabled: !church.member_form_enabled,
            }
          : {
              action,
            }
      ),
    });

    const payload = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(payload.error || "Erreur pendant la mise à jour.");
      return;
    }

    setMessage(
      action === "toggle"
        ? "Statut du formulaire mis à jour."
        : "Nouveau lien sécurisé généré."
    );

    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <QrCode className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Formulaire public d’ajout membre
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Partagez ce QR Code aux serviteurs pour qu’ils remplissent leur
                fiche membre sans compte admin.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${
                church.member_form_enabled
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {church.member_form_enabled ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}

              {church.member_form_enabled
                ? "Formulaire actif"
                : "Formulaire désactivé"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateSettings("toggle")}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA] disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {church.member_form_enabled ? "Désactiver" : "Activer"}
          </button>

          <button
            type="button"
            onClick={() => updateSettings("regenerate")}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-extrabold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Régénérer le lien
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.6fr_1.4fr]">
        <div className="rounded-3xl bg-[#F8FBFD] p-5 text-center">
          {isMounted && registrationUrl ? (
            <div className="inline-flex rounded-3xl bg-white p-4 shadow-sm">
              <QRCodeCanvas
                id="member-registration-qr"
                value={registrationUrl}
                size={240}
                level="H"
                includeMargin
              />
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-8 text-sm font-semibold text-slate-500">
              Génération du QR Code...
            </div>
          )}

          <button
            type="button"
            onClick={downloadQrCode}
            disabled={!registrationUrl}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#022B63] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Télécharger QR Code
          </button>
        </div>

        <div className="rounded-3xl bg-[#F8FBFD] p-5">
          <p className="text-sm font-bold text-[#03357A]">Lien public</p>

          <div className="mt-3 break-all rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm font-semibold text-slate-600">
            {registrationUrl || "Lien en cours de génération..."}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              disabled={!registrationUrl}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA] disabled:opacity-60"
            >
              <Clipboard className="h-4 w-4" />
              Copier le lien
            </button>

            {registrationUrl && (
              <a
                href={registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir le formulaire
              </a>
            )}
          </div>

          {message && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-extrabold text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}

          <div className="mt-5 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600">
            <strong className="text-[#03357A]">Important :</strong> si vous
            régénérez le lien, l’ancien QR Code ne fonctionnera plus. Faites-le
            seulement si l’ancien lien a été trop partagé ou compromis.
          </div>
        </div>
      </div>
    </section>
  );
}