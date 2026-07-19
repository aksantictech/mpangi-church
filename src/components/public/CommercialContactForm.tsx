"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const WHATSAPP_NUMBER = "243801655726";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10";

export default function CommercialContactForm() {
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const requestType = String(data.get("request_type") || "Démonstration");
    const churchName = String(data.get("church_name") || "").trim();
    const contactName = String(data.get("contact_name") || "").trim();
    const location = String(data.get("location") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const members = String(data.get("members") || "Non précisé").trim();
    const message = String(data.get("message") || "").trim();

    const whatsappMessage = [
      "Bonjour AKSANTIC Technology,",
      "",
      `Je souhaite demander : ${requestType}`,
      `Église : ${churchName}`,
      `Responsable : ${contactName}`,
      `Ville / Pays : ${location}`,
      `Téléphone : ${phone}`,
      `Email : ${email}`,
      `Nombre approximatif de membres : ${members}`,
      message ? `Besoin exprimé : ${message}` : "",
      "",
      "Merci de me contacter au sujet de Mpangi-Church.",
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setSubmitting(false), 600);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">Votre besoin</span>
          <select name="request_type" className={inputClass} defaultValue="Démonstration personnalisée">
            <option>Démonstration personnalisée</option>
            <option>Demande de devis</option>
            <option>Déploiement pour une église</option>
            <option>Partenariat</option>
            <option>Autre demande</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">Nom de l’église *</span>
          <input name="church_name" required className={inputClass} placeholder="Ex. Église La Grâce" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">Nom du responsable *</span>
          <input name="contact_name" required className={inputClass} placeholder="Nom et prénom" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">Ville / Pays *</span>
          <input name="location" required className={inputClass} placeholder="Kinshasa, RDC" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">Téléphone / WhatsApp *</span>
          <input name="phone" required type="tel" className={inputClass} placeholder="+243…" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">Adresse email *</span>
          <input name="email" required type="email" className={inputClass} placeholder="responsable@eglise.org" />
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className="text-sm font-black text-[#03357A]">Nombre approximatif de membres</span>
          <select name="members" className={inputClass} defaultValue="">
            <option value="" disabled>Sélectionner une tranche</option>
            <option>Moins de 100</option>
            <option>100 à 500</option>
            <option>500 à 1 500</option>
            <option>Plus de 1 500</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-black text-[#03357A]">Votre message</span>
        <textarea
          name="message"
          rows={4}
          className={`${inputClass} resize-y py-3`}
          placeholder="Décrivez brièvement vos besoins, vos modules prioritaires ou la date souhaitée pour la démonstration."
        />
      </label>

      <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold leading-6 text-green-800">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>En envoyant, votre demande sera préparée et ouverte dans WhatsApp. Vérifiez le message puis appuyez sur Envoyer.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {submitting ? "Ouverture de WhatsApp…" : "Envoyer ma demande sur WhatsApp"}
      </button>
    </form>
  );
}
