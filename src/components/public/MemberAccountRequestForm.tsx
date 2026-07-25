"use client";

import { FormEvent, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, CheckCircle2 } from "lucide-react";

export default function MemberAccountRequestForm({ churchSlug }: { churchSlug: string }) {
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [justification, setJustification] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function openScanner() {
    setScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("member-account-qr-reader", { fps: 10, qrbox: 230 }, false);
      scanner.render(
        (value) => {
          setIdentifier(value);
          setScanning(false);
          void scanner.clear();
        },
        () => undefined
      );
    }, 50);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/public/member-account-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ churchSlug, identifier, email, phone, justification }),
    });
    const payload = await response.json();
    setLoading(false);
    setSuccess(response.ok);
    setMessage(payload.message || payload.error || "Réponse indisponible.");
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h2 className="mt-4 text-xl font-black text-green-800">Demande envoyée</h2>
        <p className="mt-2 text-sm leading-6 text-green-700">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="text-sm font-black text-[#03357A]">Numéro de membre ou contenu du QR *</label>
        <div className="mt-2 flex gap-2">
          <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required placeholder="Ex. MDM-000123" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4" />
          <button type="button" onClick={openScanner} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 font-black text-[#03357A]">
            <Camera className="h-5 w-5" /> Scanner
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Utilisez le numéro généré après votre ajout comme membre. À défaut, scannez le QR de votre carte membre.</p>
      </div>
      {scanning && <div id="member-account-qr-reader" className="overflow-hidden rounded-2xl border border-slate-200" />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-black text-[#03357A]">Adresse email *
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-normal text-slate-900" />
        </label>
        <label className="text-sm font-black text-[#03357A]">Téléphone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-normal text-slate-900" />
        </label>
      </div>
      <label className="block text-sm font-black text-[#03357A]">Pourquoi souhaitez-vous un compte ?
        <textarea value={justification} onChange={(event) => setJustification(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 font-normal text-slate-900" />
      </label>
      {message && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
      <button disabled={loading} className="min-h-12 w-full rounded-2xl bg-[#03357A] px-5 font-black text-white disabled:opacity-60">
        {loading ? "Envoi en cours…" : "Envoyer ma demande de compte"}
      </button>
    </form>
  );
}

