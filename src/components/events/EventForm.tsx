"use client";

import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  CalendarDays,
  Loader2,
  Save,
} from "lucide-react";

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

type EventApiResponse = {
  error?: string;
  eventId?: string;
};

export default function EventForm({
  mode,
  churchId,
  initialEvent,
}: EventFormProps) {
  const router = useRouter();

  const [formData, setFormData] =
    useState({
      title:
        initialEvent?.title || "",
      description:
        initialEvent?.description || "",
      event_date:
        initialEvent?.event_date || "",
      start_time:
        initialEvent?.start_time?.slice(
          0,
          5
        ) || "",
      end_time:
        initialEvent?.end_time?.slice(
          0,
          5
        ) || "",
      location:
        initialEvent?.location || "",
      status:
        initialEvent?.status ||
        "active",
    });

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function updateField(
    field: keyof typeof formData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError(
        "Le titre de l’événement est obligatoire."
      );
      return;
    }

    if (!formData.event_date) {
      setError(
        "La date de l’événement est obligatoire."
      );
      return;
    }

    if (
      formData.start_time &&
      formData.end_time &&
      formData.end_time <
        formData.start_time
    ) {
      setError(
        "L’heure de fin doit être postérieure à l’heure de début."
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/events",
        {
          method:
            mode === "create"
              ? "POST"
              : "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            eventId:
              initialEvent?.id || "",
            churchId,
            title:
              formData.title,
            description:
              formData.description,
            event_date:
              formData.event_date,
            start_time:
              formData.start_time,
            end_time:
              formData.end_time,
            location:
              formData.location,
            status:
              formData.status,
          }),
        }
      );

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as
          EventApiResponse;

      if (
        !response.ok ||
        !payload.eventId
      ) {
        throw new Error(
          payload.error ||
            "Enregistrement impossible."
        );
      }

      router.push(
        `/events/${payload.eventId}`
      );
      router.refresh();
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Enregistrement impossible."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

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
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              className="input"
              placeholder="Ex : Culte dominical"
              maxLength={180}
              required
            />
          </Field>

          <Field label="Date *">
            <input
              type="date"
              value={
                formData.event_date
              }
              onChange={(event) =>
                updateField(
                  "event_date",
                  event.target.value
                )
              }
              className="input"
              required
            />
          </Field>

          <Field label="Heure de début">
            <input
              type="time"
              value={
                formData.start_time
              }
              onChange={(event) =>
                updateField(
                  "start_time",
                  event.target.value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Heure de fin">
            <input
              type="time"
              value={formData.end_time}
              onChange={(event) =>
                updateField(
                  "end_time",
                  event.target.value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Lieu">
            <input
              value={formData.location}
              onChange={(event) =>
                updateField(
                  "location",
                  event.target.value
                )
              }
              className="input"
              placeholder="Ex : Temple principal"
              maxLength={500}
            />
          </Field>

          <Field label="Statut">
            <select
              value={formData.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value
                )
              }
              className="input"
            >
              <option value="active">
                Actif
              </option>
              <option value="draft">
                Brouillon
              </option>
              <option value="completed">
                Terminé
              </option>
              <option value="cancelled">
                Annulé
              </option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                value={
                  formData.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                maxLength={10000}
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
          onClick={() =>
            router.back()
          }
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
          box-shadow: 0 0 0 4px
            rgb(3 53 122 / 0.1);
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
  children: ReactNode;
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