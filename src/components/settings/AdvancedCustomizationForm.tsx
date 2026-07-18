"use client";

import {
  Eye,
  Loader2,
  MonitorSmartphone,
  Palette,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ChurchCustomization = {
  id: string;
  name: string | null;
  public_name: string | null;
  public_hero_title: string | null;
  public_message: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;

  theme_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  surface_color?: string | null;
  text_color?: string | null;

  pwa_name?: string | null;
  pwa_short_name?: string | null;
  public_slogan?: string | null;

  public_layout?: string | null;
  public_hero_style?: string | null;
  dashboard_welcome_message?: string | null;

  show_pastor?: boolean | null;
  show_programs?: boolean | null;
  show_publications?: boolean | null;
  show_teachings?: boolean | null;
  show_donations?: boolean | null;
};

type AdvancedCustomizationFormProps = {
  church: ChurchCustomization;
};

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const DEFAULT_COLORS = {
  theme_color: "#03357A",
  secondary_color: "#2563EB",
  accent_color: "#8B5CF6",
  background_color: "#F5F9FC",
  surface_color: "#FFFFFF",
  text_color: "#0F172A",
};

function normalizeColor(
  value: string | null | undefined,
  fallback: string
) {
  const color = String(value || "").trim();

  return /^#[0-9A-Fa-f]{6}$/.test(color)
    ? color.toUpperCase()
    : fallback;
}

export default function AdvancedCustomizationForm({
  church,
}: AdvancedCustomizationFormProps) {
  const router = useRouter();
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [formData, setFormData] =
    useState({
      theme_color: normalizeColor(
        church.theme_color,
        DEFAULT_COLORS.theme_color
      ),
      secondary_color: normalizeColor(
        church.secondary_color,
        DEFAULT_COLORS.secondary_color
      ),
      accent_color: normalizeColor(
        church.accent_color,
        DEFAULT_COLORS.accent_color
      ),
      background_color: normalizeColor(
        church.background_color,
        DEFAULT_COLORS.background_color
      ),
      surface_color: normalizeColor(
        church.surface_color,
        DEFAULT_COLORS.surface_color
      ),
      text_color: normalizeColor(
        church.text_color,
        DEFAULT_COLORS.text_color
      ),

      pwa_name:
        church.pwa_name ||
        church.public_name ||
        church.name ||
        "",
      pwa_short_name:
        church.pwa_short_name || "",
      public_slogan:
        church.public_slogan || "",

      public_layout:
        church.public_layout || "modern",
      public_hero_style:
        church.public_hero_style ||
        "gradient",

      dashboard_welcome_message:
        church.dashboard_welcome_message ||
        "",

      show_pastor:
        church.show_pastor !== false,
      show_programs:
        church.show_programs !== false,
      show_publications:
        church.show_publications !== false,
      show_teachings:
        church.show_teachings !== false,
      show_donations:
        church.show_donations !== false,
    });

  function updateField<
    Key extends keyof typeof formData
  >(
    field: Key,
    value: (typeof formData)[Key]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetColors() {
    setFormData((current) => ({
      ...current,
      ...DEFAULT_COLORS,
    }));

    setMessage(
      "Les couleurs Mpangi-church ont été restaurées. Enregistrez pour confirmer."
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    const colors = [
      formData.theme_color,
      formData.secondary_color,
      formData.accent_color,
      formData.background_color,
      formData.surface_color,
      formData.text_color,
    ];

    if (
      colors.some(
        (color) =>
          !/^#[0-9A-Fa-f]{6}$/.test(color)
      )
    ) {
      setIsLoading(false);
      setMessage(
        "Une ou plusieurs couleurs sont invalides."
      );
      return;
    }

    const pwaShortName =
      formData.pwa_short_name.trim();

    if (pwaShortName.length > 28) {
      setIsLoading(false);
      setMessage(
        "Le nom court PWA ne doit pas dépasser 28 caractères."
      );
      return;
    }

    const { error } = await supabase
      .from("churches")
      .update({
        theme_color:
          formData.theme_color,
        secondary_color:
          formData.secondary_color,
        accent_color:
          formData.accent_color,
        background_color:
          formData.background_color,
        surface_color:
          formData.surface_color,
        text_color:
          formData.text_color,

        pwa_name:
          formData.pwa_name.trim() ||
          null,
        pwa_short_name:
          pwaShortName || null,
        public_slogan:
          formData.public_slogan.trim() ||
          null,

        public_layout:
          formData.public_layout,
        public_hero_style:
          formData.public_hero_style,

        dashboard_welcome_message:
          formData.dashboard_welcome_message.trim() ||
          null,

        show_pastor:
          formData.show_pastor,
        show_programs:
          formData.show_programs,
        show_publications:
          formData.show_publications,
        show_teachings:
          formData.show_teachings,
        show_donations:
          formData.show_donations,

        customization_updated_at:
          new Date().toISOString(),
      })
      .eq("id", church.id);

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Personnalisation enregistrée avec succès."
    );

    router.refresh();
  }

  const displayName =
    formData.pwa_name.trim() ||
    church.public_name ||
    church.name ||
    "Votre église";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <Palette className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black text-[#03357A]">
              Identité visuelle
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Définissez les couleurs utilisées par
              la page publique et la PWA.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ColorField
            label="Couleur principale"
            value={formData.theme_color}
            onChange={(value) =>
              updateField(
                "theme_color",
                value
              )
            }
          />

          <ColorField
            label="Couleur secondaire"
            value={
              formData.secondary_color
            }
            onChange={(value) =>
              updateField(
                "secondary_color",
                value
              )
            }
          />

          <ColorField
            label="Couleur d’accent"
            value={formData.accent_color}
            onChange={(value) =>
              updateField(
                "accent_color",
                value
              )
            }
          />

          <ColorField
            label="Arrière-plan"
            value={
              formData.background_color
            }
            onChange={(value) =>
              updateField(
                "background_color",
                value
              )
            }
          />

          <ColorField
            label="Surface des cartes"
            value={formData.surface_color}
            onChange={(value) =>
              updateField(
                "surface_color",
                value
              )
            }
          />

          <ColorField
            label="Couleur du texte"
            value={formData.text_color}
            onChange={(value) =>
              updateField(
                "text_color",
                value
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={resetColors}
          className="mt-5 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-black text-[#03357A]"
        >
          Restaurer les couleurs Mpangi-church
        </button>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <MonitorSmartphone className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black text-[#03357A]">
              Application et affichage
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Personnalisez le nom de l’application
              et la présentation publique.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nom de l’application PWA">
            <input
              value={formData.pwa_name}
              onChange={(event) =>
                updateField(
                  "pwa_name",
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Application de mon église"
            />
          </Field>

          <Field label="Nom court PWA">
            <input
              value={
                formData.pwa_short_name
              }
              onChange={(event) =>
                updateField(
                  "pwa_short_name",
                  event.target.value
                )
              }
              className={inputClass}
              maxLength={28}
              placeholder="Mon Église"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Slogan public">
              <input
                value={
                  formData.public_slogan
                }
                onChange={(event) =>
                  updateField(
                    "public_slogan",
                    event.target.value
                  )
                }
                className={inputClass}
                placeholder="Une famille, une foi, une mission"
              />
            </Field>
          </div>

          <Field label="Style de la page">
            <select
              value={
                formData.public_layout
              }
              onChange={(event) =>
                updateField(
                  "public_layout",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="modern">
                Moderne
              </option>
              <option value="classic">
                Classique
              </option>
              <option value="minimal">
                Minimal
              </option>
            </select>
          </Field>

          <Field label="Style du bandeau">
            <select
              value={
                formData.public_hero_style
              }
              onChange={(event) =>
                updateField(
                  "public_hero_style",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="gradient">
                Dégradé
              </option>
              <option value="image">
                Image de couverture
              </option>
              <option value="solid">
                Couleur unie
              </option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Message du tableau de bord">
              <input
                value={
                  formData.dashboard_welcome_message
                }
                onChange={(event) =>
                  updateField(
                    "dashboard_welcome_message",
                    event.target.value
                  )
                }
                className={inputClass}
                placeholder="Bienvenue dans votre espace de gestion"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-xl font-black text-[#03357A]">
          Sections visibles
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Choisissez les blocs affichés sur la page
          publique.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ToggleField
            label="Pasteur responsable"
            checked={formData.show_pastor}
            onChange={(checked) =>
              updateField(
                "show_pastor",
                checked
              )
            }
          />

          <ToggleField
            label="Programmes et horaires"
            checked={
              formData.show_programs
            }
            onChange={(checked) =>
              updateField(
                "show_programs",
                checked
              )
            }
          />

          <ToggleField
            label="Publications"
            checked={
              formData.show_publications
            }
            onChange={(checked) =>
              updateField(
                "show_publications",
                checked
              )
            }
          />

          <ToggleField
            label="Enseignements"
            checked={
              formData.show_teachings
            }
            onChange={(checked) =>
              updateField(
                "show_teachings",
                checked
              )
            }
          />

          <ToggleField
            label="Dons"
            checked={
              formData.show_donations
            }
            onChange={(checked) =>
              updateField(
                "show_donations",
                checked
              )
            }
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-[#03357A]" />
          <h2 className="text-xl font-black text-[#03357A]">
            Aperçu
          </h2>
        </div>

        <div
          className="mt-5 overflow-hidden rounded-[2rem] border shadow-lg"
          style={{
            backgroundColor:
              formData.background_color,
            borderColor:
              `${formData.theme_color}25`,
            color: formData.text_color,
          }}
        >
          <div
            className="p-6 text-white md:p-8"
            style={{
              background:
                formData.public_hero_style ===
                "solid"
                  ? formData.theme_color
                  : `linear-gradient(135deg, ${formData.theme_color}, ${formData.secondary_color}, ${formData.accent_color})`,
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-80">
              Page publique
            </p>

            <h3 className="mt-3 text-2xl font-black md:text-3xl">
              {displayName}
            </h3>

            <p className="mt-3 max-w-xl text-sm leading-6 opacity-90">
              {formData.public_slogan ||
                church.public_hero_title ||
                church.public_message ||
                "Bienvenue dans notre communauté."}
            </p>

            <button
              type="button"
              className="mt-5 rounded-2xl px-5 py-3 text-sm font-black"
              style={{
                backgroundColor:
                  formData.surface_color,
                color:
                  formData.theme_color,
              }}
            >
              Découvrir notre église
            </button>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-3">
            {[
              "Programmes",
              "Actualités",
              "Enseignements",
            ].map((label) => (
              <div
                key={label}
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor:
                    formData.surface_color,
                  borderColor:
                    `${formData.theme_color}20`,
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl"
                  style={{
                    backgroundColor:
                      `${formData.theme_color}15`,
                  }}
                />

                <p
                  className="mt-3 font-black"
                  style={{
                    color:
                      formData.theme_color,
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message && (
        <div
          className={[
            "rounded-2xl border p-4 text-sm font-bold",
            message.includes("succès")
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-amber-200 bg-amber-50 text-amber-800",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isLoading
            ? "Enregistrement..."
            : "Enregistrer la personnalisation"}
        </button>
      </div>
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-[#DCEAF5] bg-white p-1"
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value.toUpperCase()
            )
          }
          className={inputClass}
          maxLength={7}
          placeholder="#03357A"
        />
      </div>
    </Field>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <span className="font-bold text-[#03357A]">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-5 w-5 accent-[#03357A]"
      />
    </label>
  );
}