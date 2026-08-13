"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Upload, X } from "lucide-react";

type Props = {
  onPhoto: (file: File | null, previewUrl: string) => void;
};

export default function PublicMemberPhotoField({ onPhoto }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOpen || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => setError("Impossible d’afficher la caméra. Fermez puis réessayez."));
  }, [cameraOpen]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function openCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setError("La caméra n’est pas accessible. Autorisez-la ou choisissez une photo existante.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("La caméra n’est pas encore prête. Réessayez dans un instant.");
      return;
    }
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 900;
    const context = canvas.getContext("2d");
    if (!context) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    context.drawImage(video, sx, sy, size, size, 0, 0, 900, 900);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Impossible de capturer la photo. Réessayez.");
        return;
      }
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(url);
      onPhoto(file, url);
      stopCamera();
    }, "image/jpeg", 0.86);
  }

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setError("Le fichier sélectionné n’est pas une photo valide.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 5 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    setError("");
    onPhoto(file, url);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[0.4fr_0.6fr] md:items-center">
      <div className="flex aspect-square max-h-64 items-center justify-center overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu photo" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-slate-400"><Camera className="mx-auto h-10 w-10" /><p className="mt-2 text-sm">Aucune photo</p></div>
        )}
      </div>
      <div className="space-y-3">
        <button type="button" onClick={openCamera} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-4 text-sm font-extrabold text-white">
          <Camera className="h-5 w-5" /> Prendre une photo
        </button>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-4 text-sm font-extrabold text-[#03357A]">
          <Upload className="h-5 w-5" /> Choisir une photo existante
          <input type="file" accept="image/*" onChange={choosePhoto} className="sr-only" />
        </label>
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <p className="text-sm leading-6 text-slate-500">Photo facultative, 5 MB maximum. La capture caméra est convertie en JPG compatible.</p>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between"><p className="font-extrabold text-[#03357A]">Cadrez votre visage</p><button type="button" onClick={stopCamera} className="rounded-xl bg-slate-100 p-2"><X className="h-5 w-5" /></button></div>
            <video ref={videoRef} playsInline muted className="mt-4 aspect-square w-full rounded-3xl bg-black object-cover [transform:scaleX(-1)]" />
            <button type="button" onClick={capturePhoto} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-4 font-extrabold text-white"><Camera className="h-5 w-5" /> Capturer cette photo</button>
            <button type="button" onClick={openCamera} className="mt-2 flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-500"><RotateCcw className="h-4 w-4" /> Relancer la caméra</button>
          </div>
        </div>
      )}
    </div>
  );
}
