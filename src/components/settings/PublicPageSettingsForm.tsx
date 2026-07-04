"use client";

import { useMemo, useState } from "react";
import type { ElementType, FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Gift,
  Globe,
  Loader2,
  PlayCircle,
  Save,
  UserCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PublicPageSettingsFormProps = {
  church: {
    id: string;
    name: string | null;
    public_name: string | null;
    pastor_name: string | null;
    pastor_title: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    public_hero_title: string | null;
    public_message: string | null;
    service_times: string | null;
    youtube_channel_url: string | null;
    latest_video_url: string | null;
    news_title: string | null;
    news_description: string | null;
    donation_enabled: boolean | null;
    donation_message: string | null;
    donation_mobile_money: string | null;
    donation_mobile_money_name: string | null;
    donation_card_url: string | null;
    donation_bank_name: string | null;
    donation_bank_account_name: string | null;
    donation_bank_account_number: string | null;
    donation_bank_iban: string | null;
    donation_bank_swift: string | null;
    donation_bank_details: string | null;
  };
};

const inputClass =
  "h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const textareaClass =
  "min-h-32 w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm text-[#0F172A] outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default function PublicPageSettingsForm({
  church,
}: PublicPageSettingsFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    public_name: church.public_name || "",
    pastor_name: church.pastor_name || "",
    pastor_title: church.pastor_title || "",
    phone: church.phone || "",
    whatsapp: church.whatsapp || "",
    email: church.email || "",
    address: church.address || "",
    city: church.city || "",
    country: church.country || "RDC",
    public_hero_title: church.public_hero_title || "",
    public_message: church.public_message || "",
    service_times: church.service_times || "",
    youtube_channel_url: church.youtube_channel_url || "",
    latest_video_url: church.latest_video_url || "",
    news_title: church.news_title || "",
    news_description: church.news_description || "",
    donation_enabled: church.donation_enabled !== false,
    donation_message: church.donation_message || "",
    donation_mobile_money: church.donation_mobile_money || "",
    donation_mobile_money_name: church.donation_mobile_money_name || "",
    donation_card_url: church.donation_card_url || "",
    donation_bank_name: church.donation_bank_name || "",
    donation_bank_account_name: church.donation_bank_account_name || "",
    donation_bank_account_number: church.donation_bank_account_number || "",
    donation_bank_iban: church.donation_bank_iban || "",
    donation_bank_swift: church.donation_bank_swift || "",
    donation_bank_details: church.donation_bank_details || "",
  });

  function updateField(field: keyof typeof formData, value: string | boolean) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);

    const { error } = await supabase
      .from("churches")
      .update({
        public_name: formData.public_name.trim() || null,
        pastor_name: formData.pastor_name.trim() || null,
        pastor_title: formData.pastor_title.trim() || null,
        phone: formData.phone.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        public_hero_title: formData.public_hero_title.trim() || null,
        public_message: formData.public_message.trim() || null,
        service_times: formData.service_times.trim() || null,
        youtube_channel_url: formData.youtube_channel_url.trim() || null,
        latest_video_url: formData.latest_video_url.trim() || null,
        news_title: formData.news_title.trim() || null,
        news_description: formData.news_description.trim() || null,
        donation_enabled: formData.donation_enabled,
        donation_message: formData.donation_message.trim() || null,
        donation_mobile_money: formData.donation_mobile_money.trim() || null,
        donation_mobile_money_name:
          formData.donation_mobile_money_name.trim() || null,
        donation_card_url: formData.donation_card_url.trim() || null,
        donation_bank_name: formData.donation_bank_name.trim() || null,
        donation_bank_account_name:
          formData.donation_bank_account_name.trim() || null,
        donation_bank_account_number:
          formData.donation_bank_account_number.trim() || null,
        donation_bank_iban: formData.donation_bank_iban.trim() || null,
        donation_bank_swift: formData.donation_bank_swift.trim() || null,
        donation_bank_details: formData.donation_bank_details.trim() || null,
      })
      .eq("id", church.id);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
    alert("Page publique mise à jour avec succès.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsSection
        icon={Globe}
        title="Informations publiques"
        description="Ces informations apparaissent sur la page publique de l’église."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom public affiché">
            <input
              value={formData.public_name}
              onChange={(event) =>
                updateField("public_name", event.target.value)
              }
              className={inputClass}
              placeholder={church.name || "Nom public"}
            />
          </Field>

          <Field label="Titre d’accueil">
            <input
              value={formData.public_hero_title}
              onChange={(event) =>
                updateField("public_hero_title", event.target.value)
              }
              className={inputClass}
              placeholder="Bienvenue dans notre communauté"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Message public">
              <textarea
                value={formData.public_message}
                onChange={(event) =>
                  updateField("public_message", event.target.value)
                }
                className={textareaClass}
                placeholder="Message de bienvenue, vision de l’église, invitation..."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Programmes / horaires">
              <textarea
                value={formData.service_times}
                onChange={(event) =>
                  updateField("service_times", event.target.value)
                }
                className={textareaClass}
                placeholder={`Dimanche : Culte de célébration - 09h00\nMercredi : Prière - 17h30`}
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={UserCircle}
        title="Pasteur et contact"
        description="Informations du responsable affiché sur la page publique."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom du pasteur">
            <input
              value={formData.pastor_name}
              onChange={(event) =>
                updateField("pastor_name", event.target.value)
              }
              className={inputClass}
              placeholder="Pasteur responsable"
            />
          </Field>

          <Field label="Titre du pasteur">
            <input
              value={formData.pastor_title}
              onChange={(event) =>
                updateField("pastor_title", event.target.value)
              }
              className={inputClass}
              placeholder="Pasteur Responsable"
            />
          </Field>

          <Field label="Téléphone">
            <input
              value={formData.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputClass}
              placeholder="+243..."
            />
          </Field>

          <Field label="WhatsApp">
            <input
              value={formData.whatsapp}
              onChange={(event) => updateField("whatsapp", event.target.value)}
              className={inputClass}
              placeholder="+243..."
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClass}
              placeholder="contact@eglise.org"
            />
          </Field>

          <Field label="Ville">
            <input
              value={formData.city}
              onChange={(event) => updateField("city", event.target.value)}
              className={inputClass}
              placeholder="Kinshasa"
            />
          </Field>

          <Field label="Pays">
            <input
              value={formData.country}
              onChange={(event) => updateField("country", event.target.value)}
              className={inputClass}
              placeholder="RDC"
            />
          </Field>

          <Field label="Adresse">
            <input
              value={formData.address}
              onChange={(event) => updateField("address", event.target.value)}
              className={inputClass}
              placeholder="Adresse complète"
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={PlayCircle}
        title="YouTube et actualités"
        description="Ajoutez une chaîne YouTube ou une vidéo récente à afficher."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Lien chaîne YouTube">
            <input
              value={formData.youtube_channel_url}
              onChange={(event) =>
                updateField("youtube_channel_url", event.target.value)
              }
              className={inputClass}
              placeholder="https://youtube.com/@..."
            />
          </Field>

          <Field label="Lien dernière vidéo YouTube">
            <input
              value={formData.latest_video_url}
              onChange={(event) =>
                updateField("latest_video_url", event.target.value)
              }
              className={inputClass}
              placeholder="https://youtu.be/..."
            />
          </Field>

          <Field label="Titre actualité">
            <input
              value={formData.news_title}
              onChange={(event) =>
                updateField("news_title", event.target.value)
              }
              className={inputClass}
              placeholder="Actualités et enseignements"
            />
          </Field>

          <Field label="Description actualité">
            <input
              value={formData.news_description}
              onChange={(event) =>
                updateField("news_description", event.target.value)
              }
              className={inputClass}
              placeholder="Retrouvez les cultes et enseignements..."
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Gift}
        title="Faire un don"
        description="Configurez Mobile Money, carte bancaire et virement bancaire."
      >
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-[#F8FBFD] p-4">
          <div>
            <p className="font-extrabold text-[#03357A]">
              Activer les dons publics
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Affiche ou masque la section “Faire un don”.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateField("donation_enabled", !formData.donation_enabled)
            }
            className={`rounded-full px-4 py-2 text-sm font-extrabold ${
              formData.donation_enabled
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {formData.donation_enabled ? "Activé" : "Désactivé"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Message de don">
              <textarea
                value={formData.donation_message}
                onChange={(event) =>
                  updateField("donation_message", event.target.value)
                }
                className={textareaClass}
                placeholder="Soutenez l’œuvre de Dieu par vos dons..."
              />
            </Field>
          </div>

          <Field label="Numéro Mobile Money">
            <input
              value={formData.donation_mobile_money}
              onChange={(event) =>
                updateField("donation_mobile_money", event.target.value)
              }
              className={inputClass}
              placeholder="+243..."
            />
          </Field>

          <Field label="Nom bénéficiaire Mobile Money">
            <input
              value={formData.donation_mobile_money_name}
              onChange={(event) =>
                updateField("donation_mobile_money_name", event.target.value)
              }
              className={inputClass}
              placeholder="Nom du bénéficiaire"
            />
          </Field>

          <Field label="Lien paiement carte">
            <input
              value={formData.donation_card_url}
              onChange={(event) =>
                updateField("donation_card_url", event.target.value)
              }
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <Field label="Nom de la banque">
            <input
              value={formData.donation_bank_name}
              onChange={(event) =>
                updateField("donation_bank_name", event.target.value)
              }
              className={inputClass}
              placeholder="Nom de la banque"
            />
          </Field>

          <Field label="Nom du compte">
            <input
              value={formData.donation_bank_account_name}
              onChange={(event) =>
                updateField("donation_bank_account_name", event.target.value)
              }
              className={inputClass}
              placeholder="Nom du compte bancaire"
            />
          </Field>

          <Field label="Numéro de compte">
            <input
              value={formData.donation_bank_account_number}
              onChange={(event) =>
                updateField("donation_bank_account_number", event.target.value)
              }
              className={inputClass}
              placeholder="Numéro de compte"
            />
          </Field>

          <Field label="IBAN">
            <input
              value={formData.donation_bank_iban}
              onChange={(event) =>
                updateField("donation_bank_iban", event.target.value)
              }
              className={inputClass}
              placeholder="IBAN"
            />
          </Field>

          <Field label="SWIFT">
            <input
              value={formData.donation_bank_swift}
              onChange={(event) =>
                updateField("donation_bank_swift", event.target.value)
              }
              className={inputClass}
              placeholder="SWIFT"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Détails bancaires complémentaires">
              <textarea
                value={formData.donation_bank_details}
                onChange={(event) =>
                  updateField("donation_bank_details", event.target.value)
                }
                className={textareaClass}
                placeholder="Instructions de virement, référence à indiquer..."
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          <Eye className="h-4 w-4" />
          Annuler
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#03357A]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#03357A]">
        {label}
      </span>
      {children}
    </label>
  );
}