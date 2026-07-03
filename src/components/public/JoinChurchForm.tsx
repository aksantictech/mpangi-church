"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type JoinChurchFormProps = {
  churchId: string;
  churchName: string;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#DCEAF5] bg-white px-5 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

export default function JoinChurchForm({
  churchId,
  churchName,
}: JoinChurchFormProps) {
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [visitorStatus, setVisitorStatus] = useState("nouveau_visiteur");
  const [message, setMessage] = useState("");

  const [needsPrayer, setNeedsPrayer] = useState(false);
  const [wantsMeeting, setWantsMeeting] = useState(false);
  const [wantsBaptism, setWantsBaptism] = useState(false);
  const [wantsMembership, setWantsMembership] = useState(false);
  const [wantsTraining, setWantsTraining] = useState(false);
  const [wantsHomeVisit, setWantsHomeVisit] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!name.trim()) {
      setErrorMessage("Votre nom est obligatoire.");
      setIsLoading(false);
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Votre téléphone ou WhatsApp est obligatoire.");
      setIsLoading(false);
      return;
    }

    const selectedNeeds = [
      needsPrayer ? "Besoin de prière" : null,
      wantsMeeting ? "Souhaite un entretien" : null,
      wantsBaptism ? "Souhaite le baptême" : null,
      wantsMembership ? "Souhaite intégrer l’église" : null,
      wantsTraining ? "Souhaite une formation / discipolat" : null,
      wantsHomeVisit ? "Souhaite une visite à domicile" : null,
    ].filter(Boolean);

    const finalMessage = [
      message.trim(),
      selectedNeeds.length > 0
        ? `Besoins sélectionnés : ${selectedNeeds.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabase.from("join_requests").insert({
      church_id: churchId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      address: address.trim() || null,
      visitor_status: visitorStatus,
      message: finalMessage || "Souhaite rejoindre l’église.",
      needs_prayer: needsPrayer,
      wants_meeting: wantsMeeting,
      wants_baptism: wantsBaptism,
      wants_membership: wantsMembership,
      wants_training: wantsTraining,
      wants_home_visit: wantsHomeVisit,
      status: "nouvelle",
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      `Merci. Votre demande a été envoyée à ${churchName}. L’équipe de l’église vous contactera.`
    );

    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setVisitorStatus("nouveau_visiteur");
    setMessage("");
    setNeedsPrayer(false);
    setWantsMeeting(false);
    setWantsBaptism(false);
    setWantsMembership(false);
    setWantsTraining(false);
    setWantsHomeVisit(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#03357A]">
          Vos informations
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Nom complet *</label>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Votre nom complet"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Téléphone / WhatsApp *</label>
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+243..."
              required
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className={labelClass}>Adresse / commune</label>
            <input
              className={inputClass}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Votre adresse ou commune"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Votre situation</label>
            <select
              className={inputClass}
              value={visitorStatus}
              onChange={(event) => setVisitorStatus(event.target.value)}
            >
              <option value="nouveau_visiteur">Je suis nouveau visiteur</option>
              <option value="nouveau_converti">Je suis nouveau converti</option>
              <option value="ancien_membre">Je suis ancien membre</option>
              <option value="cherche_eglise">Je cherche une église locale</option>
              <option value="autre">Autre situation</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Un message ou un besoin particulier</label>
            <textarea
              rows={6}
              className={inputClass}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Partagez-nous ce que vous souhaitez nous communiquer."
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-[#EAF3FA] p-6">
        <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#2563EB]">
          Accompagnement pastoral
        </p>

        <h2 className="mt-3 text-2xl font-extrabold text-[#03357A]">
          Comment pouvons-nous vous accompagner ?
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Sélectionnez les besoins pour lesquels vous souhaitez être accompagné(e)
          par l’équipe de l’église.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <NeedCard
            label="J’ai besoin de prière"
            checked={needsPrayer}
            onChange={setNeedsPrayer}
          />

          <NeedCard
            label="Je souhaite un entretien"
            checked={wantsMeeting}
            onChange={setWantsMeeting}
          />

          <NeedCard
            label="Je souhaite le baptême"
            checked={wantsBaptism}
            onChange={setWantsBaptism}
          />

          <NeedCard
            label="Je souhaite intégrer l’église"
            checked={wantsMembership}
            onChange={setWantsMembership}
          />

          <NeedCard
            label="Je souhaite une formation"
            checked={wantsTraining}
            onChange={setWantsTraining}
          />

          <NeedCard
            label="Je souhaite une visite à domicile"
            checked={wantsHomeVisit}
            onChange={setWantsHomeVisit}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
      >
        <Send className="h-5 w-5" />
        {isLoading ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}

function NeedCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 font-bold shadow-sm transition ${
        checked
          ? "border-[#03357A] bg-white text-[#03357A] ring-4 ring-[#03357A]/10"
          : "border-[#DCEAF5] bg-white text-slate-700 hover:border-[#B8D4EA]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-[#03357A]"
      />

      <span>{label}</span>
    </label>
  );
}