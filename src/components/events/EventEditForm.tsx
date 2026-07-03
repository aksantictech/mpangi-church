"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ChurchOption = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  church_id: string | null;
  role: string;
};

type EventItem = {
  id: string;
  church_id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  status: string;
};

type EventEditFormProps = {
  event: EventItem;
  profile: Profile;
  churches: ChurchOption[];
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function EventEditForm({
  event,
  profile,
  churches,
}: EventEditFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [churchId, setChurchId] = useState(event.church_id);
  const [title, setTitle] = useState(event.title ?? "");
  const [eventType, setEventType] = useState(event.event_type ?? "culte");
  const [startDate, setStartDate] = useState(toDateTimeLocal(event.start_date));
  const [endDate, setEndDate] = useState(toDateTimeLocal(event.end_date));
  const [location, setLocation] = useState(event.location ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [status, setStatus] = useState(event.status ?? "planifie");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!churchId) {
      setErrorMessage("Aucune église sélectionnée.");
      setIsLoading(false);
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Le titre est obligatoire.");
      setIsLoading(false);
      return;
    }

    if (!startDate) {
      setErrorMessage("La date de début est obligatoire.");
      setIsLoading(false);
      return;
    }

    const eventDate = startDate.slice(0, 10);

    const { error } = await supabase
      .from("events")
      .update({
        church_id: churchId,
        title: title.trim(),
        event_type: eventType,
        event_date: eventDate,
        start_date: startDate,
        end_date: endDate || null,
        location: location.trim() || null,
        description: description.trim() || null,
        status,
      })
      .eq("id", event.id);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Événement modifié avec succès.");

    setTimeout(() => {
      router.push(`/events/${event.id}`);
      router.refresh();
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Informations de l’événement
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {profile.role === "super_admin" && (
            <div>
              <label className={labelClass}>Église *</label>
              <select
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className={inputClass}
                required
              >
                {churches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Titre *</label>
            <input
              type="text"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className={inputClass}
            >
              <option value="culte">Culte</option>
              <option value="reunion">Réunion</option>
              <option value="formation">Formation</option>
              <option value="conference">Conférence</option>
              <option value="priere">Prière</option>
              <option value="evangelisation">Évangélisation</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Début *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Fin</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Lieu</label>
            <input
              type="text"
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              rows={5}
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(`/events/${event.id}`)}
          className="rounded-2xl border border-[#C9DBEA] px-5 py-3 font-bold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}