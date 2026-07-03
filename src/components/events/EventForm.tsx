"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EventFormProps = {
  mode: "create" | "edit";
  churchId: string;
  initialEvent?: {
    id: string;
    title: string | null;
    description: string | null;
    event_date: string | null;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    status: string | null;
  };
};

export default function EventForm({
  mode,
  churchId,
  initialEvent,
}: EventFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    title: initialEvent?.title || "",
    description: initialEvent?.description || "",
    event_date: initialEvent?.event_date || "",
    start_time: initialEvent?.start_time || "",
    end_time: initialEvent?.end_time || "",
    location: initialEvent?.location || "",
    status: initialEvent?.status || "active",
  });

  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert("Le titre de l’événement est obligatoire.");
      return;
    }

    if (!formData.event_date) {
      alert("La date de l’événement est obligatoire.");
      return;
    }

    setIsLoading(true);

    if (mode === "create") {
      const { data, error } = await supabase
        .from("events")
        .insert({
          church_id: churchId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_date: formData.event_date,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          location: formData.location.trim() || null,
          status: formData.status,
        })
        .select("id")
        .single();

      setIsLoading(false);

      if (error || !data) {
        alert(error?.message || "Erreur lors de la création de l’événement.");
        return;
      }

      router.push(`/events/${data.id}`);
      router.refresh();
      return;
    }

    if (!initialEvent?.id) {
      setIsLoading(false);
      alert("Événement introuvable.");
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: formData.event_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        location: formData.location.trim() || null,
        status: formData.status,
      })
      .eq("id", initialEvent.id)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/events/${initialEvent.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <CalendarDays className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Informations de l’événement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Renseignez les informations principales de l’événement.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Titre *">
            <input
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="input"
              placeholder="Ex : Culte dominical"
              required
            />
          </Field>

          <Field label="Date *">
            <input
              type="date"
              value={formData.event_date}
              onChange={(event) =>
                updateField("event_date", event.target.value)
              }
              className="input"
              required
            />
          </Field>

          <Field label="Heure de début">
            <input
              type="time"
              value={formData.start_time}
              onChange={(event) =>
                updateField("start_time", event.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Heure de fin">
            <input
              type="time"
              value={formData.end_time}
              onChange={(event) => updateField("end_time", event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Lieu">
            <input
              value={formData.location}
              onChange={(event) => updateField("location", event.target.value)}
              className="input"
              placeholder="Ex : Temple principal"
            />
          </Field>

          <Field label="Statut">
            <select
              value={formData.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="input"
            >
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                value={formData.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                className="min-h-36 w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
                placeholder="Détails, programme, instructions..."
              />
            </Field>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isLoading
            ? "Enregistrement..."
            : mode === "create"
              ? "Créer l’événement"
              : "Enregistrer"}
        </button>
      </div>

      <style jsx>{`
        .input {
          height: 48px;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #dceaf5;
          background: white;
          padding: 0 1rem;
          font-size: 0.875rem;
          outline: none;
          color: #0f172a;
        }

        .input:focus {
          border-color: #03357a;
          box-shadow: 0 0 0 4px rgb(3 53 122 / 0.1);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#03357A]">
        {label}
      </span>

      {children}
    </label>
  );
}