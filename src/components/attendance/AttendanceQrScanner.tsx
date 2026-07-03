"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, QrCode, RotateCcw, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "@/lib/supabase/client";

type AttendanceQrScannerProps = {
  churchId: string;
  eventId: string;
  profileId: string;
  attendanceDate: string;
};

type ScanResult = {
  type: "success" | "warning" | "error";
  message: string;
  memberName?: string;
};

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

function extractMemberId(decodedText: string, churchId: string) {
  try {
    const payload = JSON.parse(decodedText);

    if (payload.type && payload.type !== "mpangi_church_member") {
      return {
        memberId: null,
        error: "Ce QR Code n’est pas un QR Code membre Mpangi-church.",
      };
    }

    if (payload.church_id && payload.church_id !== churchId) {
      return {
        memberId: null,
        error: "Ce QR Code appartient à une autre église.",
      };
    }

    if (!payload.member_id) {
      return {
        memberId: null,
        error: "QR Code invalide : identifiant membre manquant.",
      };
    }

    return {
      memberId: String(payload.member_id),
      error: null,
    };
  } catch {
    return {
      memberId: decodedText.trim(),
      error: null,
    };
  }
}

export default function AttendanceQrScanner({
  churchId,
  eventId,
  profileId,
  attendanceDate,
}: AttendanceQrScannerProps) {
  const supabase = useMemo(() => createClient(), []);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);

  async function processMember(memberId: string) {
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, church_id, first_name, middle_name, last_name, status")
      .eq("id", memberId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (memberError) {
      setResult({
        type: "error",
        message: memberError.message,
      });
      return;
    }

    if (!member) {
      setResult({
        type: "error",
        message: "Membre introuvable ou non autorisé pour cette église.",
      });
      return;
    }

    if (member.status && member.status !== "actif") {
      setResult({
        type: "warning",
        message: "Ce membre n’est pas actif.",
        memberName: getMemberName(member) || "Membre",
      });
      return;
    }

    const memberName = getMemberName(member) || "Membre";

    const { data: existingAttendance, error: existingError } = await supabase
      .from("attendances")
      .select("id")
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .eq("member_id", member.id)
      .maybeSingle();

    if (existingError) {
      setResult({
        type: "error",
        message: existingError.message,
      });
      return;
    }

    if (existingAttendance) {
      setResult({
        type: "warning",
        message: "Ce membre est déjà pointé pour cet événement.",
        memberName,
      });
      return;
    }

    const { error: insertError } = await supabase.from("attendances").insert({
      church_id: churchId,
      event_id: eventId,
      member_id: member.id,
      attendance_date: attendanceDate,
      check_in_time: new Date().toISOString(),
      status: "present",
      method: "qr",
      created_by: profileId,
    });

    if (insertError) {
      setResult({
        type: "error",
        message: insertError.message,
      });
      return;
    }

    setScanCount((current) => current + 1);

    setResult({
      type: "success",
      message: "Présence enregistrée avec succès.",
      memberName,
    });
  }

  async function handleDecodedText(decodedText: string) {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    const { memberId, error } = extractMemberId(decodedText, churchId);

    if (error || !memberId) {
      setResult({
        type: "error",
        message: error || "QR Code invalide.",
      });

      window.setTimeout(() => {
        isProcessingRef.current = false;
      }, 1800);

      return;
    }

    await processMember(memberId);

    window.setTimeout(() => {
      isProcessingRef.current = false;
    }, 1800);
  }

  useEffect(() => {
    const scanner = new Html5Qrcode("attendance-qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 260,
            height: 260,
          },
        },
        (decodedText) => {
          void handleDecodedText(decodedText);
        },
        () => {
          // On ignore les lectures partielles.
        }
      )
      .then(() => {
        setIsStarting(false);
      })
      .catch((error) => {
        setIsStarting(false);
        setCameraError(
          error instanceof Error
            ? error.message
            : "Impossible d’ouvrir la caméra."
        );
      });

    return () => {
      isProcessingRef.current = true;

      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {
          // Le scanner peut déjà être arrêté.
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetMessage() {
    setResult(null);
  }

  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <QrCode className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Scanner QR Code
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Scannez le QR Code membre pour enregistrer sa présence.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-bold text-[#03357A]">
          Scans réussis : {scanCount}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <div className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#0F172A] p-4">
          {isStarting && (
            <div className="flex min-h-[360px] items-center justify-center text-white">
              <div className="flex items-center gap-3 text-sm font-bold">
                <Loader2 className="h-5 w-5 animate-spin" />
                Ouverture de la caméra...
              </div>
            </div>
          )}

          {cameraError && (
            <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
              <div>
                <XCircle className="mx-auto h-12 w-12 text-red-400" />

                <h3 className="mt-4 text-lg font-extrabold text-white">
                  Caméra indisponible
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {cameraError}
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  Vérifiez l’autorisation caméra du navigateur ou testez depuis
                  un téléphone.
                </p>
              </div>
            </div>
          )}

          <div
            id="attendance-qr-reader"
            className={cameraError ? "hidden" : "overflow-hidden rounded-2xl"}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
            <h3 className="font-extrabold text-[#03357A]">
              Résultat du dernier scan
            </h3>

            {!result && (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Aucun QR Code scanné pour le moment. Placez le QR Code du membre
                devant la caméra.
              </p>
            )}

            {result && (
              <div
                className={`mt-4 rounded-2xl p-4 ${
                  result.type === "success"
                    ? "bg-green-50 text-green-700"
                    : result.type === "warning"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5" />
                  )}

                  <div>
                    {result.memberName && (
                      <p className="font-extrabold">{result.memberName}</p>
                    )}

                    <p className="mt-1 text-sm font-semibold">
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <button
                type="button"
                onClick={resetMessage}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#03357A] ring-1 ring-[#DCEAF5] hover:bg-[#EAF3FA]"
              >
                <RotateCcw className="h-4 w-4" />
                Effacer le message
              </button>
            )}
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5">
            <h3 className="font-extrabold text-[#03357A]">
              Contrôles de sécurité
            </h3>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
              <li>Le membre doit appartenir à votre église.</li>
              <li>Le membre doit avoir le statut actif.</li>
              <li>Un membre ne peut être pointé qu’une seule fois.</li>
              <li>Les QR Codes d’autres églises sont refusés.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}