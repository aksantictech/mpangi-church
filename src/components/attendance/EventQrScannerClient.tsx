"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Keyboard,
  Loader2,
  ScanLine,
  XCircle,
} from "lucide-react";

type EventQrScannerClientProps = {
  eventId: string;
};

type ScanResult = {
  status: "checked_in" | "already_checked_in" | "error";
  message: string;
  memberName?: string;
};

function getShortQrValue(value: string) {
  if (!value) return "";
  if (value.length <= 90) return value;
  return `${value.slice(0, 70)}...${value.slice(-12)}`;
}

export default function EventQrScannerClient({
  eventId,
}: EventQrScannerClientProps) {
  const router = useRouter();

  const scannerRef = useRef<any>(null);
  const isSubmittingRef = useRef(false);
  const lastCameraErrorAtRef = useRef(0);

  const [isScannerReady, setIsScannerReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [manualQrValue, setManualQrValue] = useState("");
  const [lastRawScan, setLastRawScan] = useState("");
  const [cameraStatus, setCameraStatus] = useState(
    "Caméra non démarrée."
  );
  const [result, setResult] = useState<ScanResult | null>(null);

  async function playSuccessSound() {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {
      // Le son est optionnel.
    }
  }

  async function submitQr(qrValue: string) {
    const cleanQrValue = qrValue.trim();

    if (!cleanQrValue || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setLastRawScan(cleanQrValue);
    setResult(null);
    setCameraStatus("QR détecté. Enregistrement de la présence...");

    try {
      await playSuccessSound();

      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          qrValue: cleanQrValue,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setResult({
          status: "error",
          message: payload.error || "Impossible d’enregistrer la présence.",
        });
        setCameraStatus("QR lu, mais la présence n’a pas été enregistrée.");
        return;
      }

      setResult({
        status: payload.status,
        message: payload.message,
        memberName: payload.member?.name,
      });

      setCameraStatus("Présence traitée. Vous pouvez scanner le suivant.");
      router.refresh();
    } catch {
      setResult({
        status: "error",
        message: "Erreur pendant la lecture du QR Code.",
      });
      setCameraStatus("Erreur pendant le traitement du QR Code.");
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1400);
    }
  }

  async function getScannerInstance() {
    const html5QrCodeModule = await import("html5-qrcode");
    const Html5Qrcode = (html5QrCodeModule as any).Html5Qrcode;
    const Html5QrcodeSupportedFormats = (html5QrCodeModule as any)
      .Html5QrcodeSupportedFormats;

    if (scannerRef.current) {
      return scannerRef.current;
    }

    const scanner = new Html5Qrcode("event-qr-reader", {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });

    scannerRef.current = scanner;

    return scanner;
  }

  async function startScanner() {
    setIsStarting(true);
    setResult(null);
    setCameraStatus("Initialisation de la caméra...");

    try {
      const html5QrCodeModule = await import("html5-qrcode");
      const Html5Qrcode = (html5QrCodeModule as any).Html5Qrcode;
      const scanner = await getScannerInstance();

      if (isScannerReady) {
        setIsStarting(false);
        return;
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        setResult({
          status: "error",
          message:
            "Aucune caméra détectée. Vérifiez les autorisations du navigateur.",
        });
        setCameraStatus("Aucune caméra détectée.");
        return;
      }

      const backCamera =
        cameras.find((camera: any) =>
          /back|rear|environment|arrière|arri[eè]re/i.test(camera.label || "")
        ) || cameras[cameras.length - 1];

      const cameraConfig = backCamera?.id || { facingMode: "environment" };

      await scanner.start(
        cameraConfig,
        {
          fps: 8,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.max(220, Math.floor(minEdge * 0.72));

            return {
              width: qrboxSize,
              height: qrboxSize,
            };
          },
          aspectRatio: 1.333334,
          disableFlip: false,
        },
        async (decodedText: string) => {
          await submitQr(decodedText);
        },
        (errorMessage: string) => {
          const now = Date.now();

          if (now - lastCameraErrorAtRef.current > 2500) {
            lastCameraErrorAtRef.current = now;
            setCameraStatus(
              "Recherche du QR Code... rapprochez le code, augmentez la lumière et gardez l’image stable."
            );
          }
        }
      );

      setIsScannerReady(true);
      setCameraStatus(
        "Caméra active. Placez le QR Code personnel du membre dans le cadre."
      );
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d’ouvrir la caméra. Vérifiez l’autorisation caméra ou utilisez la saisie manuelle.",
      });
      setCameraStatus("Caméra non disponible.");
    } finally {
      setIsStarting(false);
    }
  }

  async function stopScanner() {
    if (!scannerRef.current) return;

    try {
      if (isScannerReady) {
        await scannerRef.current.stop();
      }

      scannerRef.current.clear();
    } catch {
      // Rien à faire.
    }

    scannerRef.current = null;
    setIsScannerReady(false);
    setCameraStatus("Caméra arrêtée.");
  }

  async function handleFileScan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsScanningFile(true);
    setResult(null);
    setCameraStatus("Lecture du QR Code depuis l’image...");

    try {
      const scanner = await getScannerInstance();
      const decodedText = await scanner.scanFile(file, true);

      await submitQr(decodedText);
    } catch {
      setResult({
        status: "error",
        message:
          "Impossible de lire le QR Code dans cette image. Essayez une image plus nette ou utilisez la saisie manuelle.",
      });
      setCameraStatus("Lecture image échouée.");
    } finally {
      setIsScanningFile(false);
      event.target.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  function handleManualSubmit() {
    if (!manualQrValue.trim()) return;

    void submitQr(manualQrValue);
    setManualQrValue("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Scanner le QR Code du membre
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Autorisez la caméra, puis placez le QR Code personnel du membre
              dans le cadre. Utilisez une bonne lumière et évitez les reflets.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void startScanner()}
              disabled={isStarting || isScannerReady}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Démarrer caméra
            </button>

            {isScannerReady && (
              <button
                type="button"
                onClick={() => void stopScanner()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-extrabold text-red-700"
              >
                Arrêter
              </button>
            )}

            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#DCEAF5]">
              {isScanningFile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              Lire une image QR
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileScan}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-3">
          <div
            id="event-qr-reader"
            className="mx-auto min-h-[340px] max-w-xl overflow-hidden rounded-2xl bg-white"
          />
        </div>

        <div className="mt-4 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-semibold text-slate-600">
          <div className="flex items-start gap-2">
            <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-[#03357A]" />
            <span>{cameraStatus}</span>
          </div>

          {lastRawScan && (
            <p className="mt-2 break-words text-xs text-slate-500">
              Dernier QR détecté : {getShortQrValue(lastRawScan)}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div
          className={`flex items-start gap-3 rounded-3xl border p-5 text-sm font-bold ${
            result.status === "checked_in"
              ? "border-green-200 bg-green-50 text-green-700"
              : result.status === "already_checked_in"
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.status === "checked_in" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
          ) : result.status === "already_checked_in" ? (
            <AlertTriangle className="mt-0.5 h-5 w-5" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5" />
          )}

          <span>{result.message}</span>
        </div>
      )}

      <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <Keyboard className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-extrabold text-[#03357A]">
              Saisie manuelle de secours
            </h2>

            <p className="text-sm text-slate-500">
              À utiliser si la caméra ou la lecture automatique ne fonctionne
              pas. Collez le lien complet de la carte QR du membre.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={manualQrValue}
            onChange={(event) => setManualQrValue(event.target.value)}
            placeholder="Coller ici le lien ou token QR du membre"
            className="min-h-12 flex-1 rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          />

          <button
            type="button"
            onClick={handleManualSubmit}
            className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
