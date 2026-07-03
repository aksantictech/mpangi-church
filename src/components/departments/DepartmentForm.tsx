"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DepartmentFormProps = {
  mode: "create" | "edit";
  churchId: string;
  initialDepartment?: {
    id: string;
    name: string | null;
    description: string | null;
    status: string | null;
  };
};

export default function DepartmentForm({
  mode,
  churchId,
  initialDepartment,
}: DepartmentFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] = useState({
    name: initialDepartment?.name || "",
    description: initialDepartment?.description || "",
    status: initialDepartment?.status || "active",
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

    if (!formData.name.trim()) {
      alert("Le nom du département est obligatoire.");
      return;
    }

    setIsLoading(true);

    if (mode === "create") {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          church_id: churchId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
        })
        .select("id")
        .single();

      setIsLoading(false);

      if (error || !data) {
        alert(error?.message || "Erreur lors de la création du département.");
        return;
      }

      router.push(`/departments/${data.id}`);
      router.refresh();
      return;
    }

    if (!initialDepartment?.id) {
      setIsLoading(false);
      alert("Département introuvable.");
      return;
    }

    const { error } = await supabase
      .from("departments")
      .update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
      })
      .eq("id", initialDepartment.id)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/departments/${initialDepartment.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Informations du département
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Renseignez le nom, la description et le statut.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nom du département *">
            <input
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="input"
              placeholder="Ex : Intercession"
              required
            />
          </Field>

          <Field label="Statut">
            <select
              value={formData.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="input"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
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
                placeholder="Mission, responsabilités, activités..."
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
              ? "Créer le département"
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