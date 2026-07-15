"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Save, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ChurchFormInitial = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  logo_url?: string | null;
  pastor_photo_url?: string | null;
  pastor_name?: string | null;
  pastor_title?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  public_hero_title?: string | null;
  public_message?: string | null;
  service_times?: string | null;
  public_enabled?: boolean | null;
  login_enabled?: boolean | null;
  youtube_channel_url?: string | null;
  latest_video_url?: string | null;
  news_title?: string | null;
  news_description?: string | null;
};

type SuperAdminChurchFormProps = {
  initialChurch?: ChurchFormInitial;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "png";
}

export default function SuperAdminChurchForm({
  initialChurch,
}: SuperAdminChurchFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isEditMode = Boolean(initialChurch?.id);

  const [name, setName] = useState(initialChurch?.name ?? "");
  const [slug, setSlug] = useState(initialChurch?.slug ?? "");
  const [status, setStatus] = useState(initialChurch?.status ?? "active");

  const [address, setAddress] = useState(initialChurch?.address ?? "");
  const [city, setCity] = useState(initialChurch?.city ?? "Kinshasa");
  const [country, setCountry] = useState(initialChurch?.country ?? "RDC");
  const [phone, setPhone] = useState(initialChurch?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initialChurch?.whatsapp ?? "");
  const [email, setEmail] = useState(initialChurch?.email ?? "");

  const [pastorName, setPastorName] = useState(
    initialChurch?.pastor_name ?? ""
  );
  const [pastorTitle, setPastorTitle] = useState(
    initialChurch?.pastor_title ?? "Pasteur responsable"
  );

  const [publicHeroTitle, setPublicHeroTitle] = useState(
    initialChurch?.public_hero_title ?? ""
  );
  const [publicMessage, setPublicMessage] = useState(
    initialChurch?.public_message ?? ""
  );
  const [serviceTimes, setServiceTimes] = useState(
    initialChurch?.service_times ?? ""
  );

  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState(
    initialChurch?.youtube_channel_url ?? ""
  );
  const [latestVideoUrl, setLatestVideoUrl] = useState(
    initialChurch?.latest_video_url ?? ""
  );
  const [newsTitle, setNewsTitle] = useState(
    initialChurch?.news_title ?? "Actualités et enseignements"
  );
  const [newsDescription, setNewsDescription] = useState(
    initialChurch?.news_description ?? ""
  );

  const [publicEnabled, setPublicEnabled] = useState(
    initialChurch?.public_enabled ?? true
  );
  const [loginEnabled, setLoginEnabled] = useState(
    initialChurch?.login_enabled ?? true
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pastorPhotoFile, setPastorPhotoFile] = useState<File | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);

    if (!isEditMode && !slug) {
      setSlug(slugify(value));
    }
  }

  async function uploadChurchAsset(file: File, churchSlug: string, type: string) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Le fichier ne doit pas dépasser 5 Mo.");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format non supporté. Utilisez PNG, JPG ou WEBP.");
    }

    const extension = getFileExtension(file);
    const path = `churches/${churchSlug}/${type}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("church-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`Erreur upload ${type} : ${error.message}`);
    }

    const { data } = supabase.storage.from("church-assets").getPublicUrl(path);

    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error("Le nom de l’église est obligatoire.");
      }

      const finalSlug = slugify(slug || name);

      if (!finalSlug) {
        throw new Error("Le slug public est obligatoire.");
      }

      let logoUrl = initialChurch?.logo_url ?? null;
      let pastorPhotoUrl = initialChurch?.pastor_photo_url ?? null;

      if (logoFile) {
        logoUrl = await uploadChurchAsset(logoFile, finalSlug, "logo");
      }

      if (pastorPhotoFile) {
        pastorPhotoUrl = await uploadChurchAsset(
          pastorPhotoFile,
          finalSlug,
          "pastor"
        );
      }

      const payload = {
        name: name.trim(),
        slug: finalSlug,
        status,
        logo_url: logoUrl,
        pastor_photo_url: pastorPhotoUrl,
        pastor_name: pastorName.trim() || null,
        pastor_title: pastorTitle.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country.trim() || "RDC",
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        public_hero_title:
          publicHeroTitle.trim() || `Bienvenue à ${name.trim()}`,
        public_message: publicMessage.trim() || null,
        service_times: serviceTimes.trim() || null,
        public_enabled: publicEnabled,
        login_enabled: loginEnabled,
        youtube_channel_url: youtubeChannelUrl.trim() || null,
        latest_video_url: latestVideoUrl.trim() || null,
        news_title: newsTitle.trim() || null,
        news_description: newsDescription.trim() || null,
      };

      if (isEditMode && initialChurch?.id) {
        const { error } = await supabase
          .from("churches")
          .update(payload)
          .eq("id", initialChurch.id);

        if (error) {
          throw new Error(error.message);
        }

        setSuccessMessage("Église modifiée avec succès.");

        setTimeout(() => {
          router.push(`/super-admin/churches/${initialChurch.id}`);
          router.refresh();
        }, 700);

        return;
      }

      const { data: createdChurch, error } = await supabase
        .from("churches")
        .insert(payload)
        .select("id")
        .single();

      if (error || !createdChurch) {
        throw new Error(error?.message ?? "Erreur lors de la création.");
      }

      setSuccessMessage("Église créée avec succès.");

      setTimeout(() => {
        router.push(`/super-admin/churches/${createdChurch.id}`);
        router.refresh();
      }, 700);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue."
      );
    } finally {
      setIsLoading(false);
    }
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
          Identité de l’église
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Nom de l’église *</label>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Slug public *</label>
            <input
              className={inputClass}
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Lien public : /church/{slug || "slug-eglise"}
            </p>
          </div>

          <div>
            <label className={labelClass}>Statut</label>
            <select
              className={inputClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspendue</option>
              <option value="archived">Archivée</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Logo de l’église</label>
            <FilePicker
              label="Choisir le logo"
              file={logoFile}
              existingUrl={initialChurch?.logo_url ?? null}
              onChange={setLogoFile}
            />
          </div>

          <div>
            <label className={labelClass}>Photo du pasteur</label>
            <FilePicker
              label="Choisir la photo"
              file={pastorPhotoFile}
              existingUrl={initialChurch?.pastor_photo_url ?? null}
              onChange={setPastorPhotoFile}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Responsable et contacts
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Nom du pasteur</label>
            <input
              className={inputClass}
              value={pastorName}
              onChange={(event) => setPastorName(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Titre du responsable</label>
            <input
              className={inputClass}
              value={pastorTitle}
              onChange={(event) => setPastorTitle(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              className={inputClass}
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Ville</label>
            <input
              className={inputClass}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Pays</label>
            <input
              className={inputClass}
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Adresse</label>
            <input
              className={inputClass}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Page publique
        </h2>

        <div className="mt-5 grid gap-5">
          <div>
            <label className={labelClass}>Titre principal</label>
            <input
              className={inputClass}
              value={publicHeroTitle}
              onChange={(event) => setPublicHeroTitle(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Message public</label>
            <textarea
              rows={4}
              className={inputClass}
              value={publicMessage}
              onChange={(event) => setPublicMessage(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Programmes</label>
            <textarea
              rows={5}
              className={inputClass}
              value={serviceTimes}
              onChange={(event) => setServiceTimes(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 font-bold text-[#03357A]">
              <input
                type="checkbox"
                checked={publicEnabled}
                onChange={(event) => setPublicEnabled(event.target.checked)}
                className="h-5 w-5"
              />
              Activer la page publique
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 font-bold text-[#03357A]">
              <input
                type="checkbox"
                checked={loginEnabled}
                onChange={(event) => setLoginEnabled(event.target.checked)}
                className="h-5 w-5"
              />
              Afficher “Espace église”
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Actualités et enseignements
        </h2>

        <div className="mt-5 grid gap-5">
          <div>
            <label className={labelClass}>Lien chaîne YouTube</label>
            <input
              className={inputClass}
              value={youtubeChannelUrl}
              onChange={(event) => setYoutubeChannelUrl(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Lien dernière vidéo YouTube</label>
            <input
              className={inputClass}
              value={latestVideoUrl}
              onChange={(event) => setLatestVideoUrl(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Titre actualités</label>
            <input
              className={inputClass}
              value={newsTitle}
              onChange={(event) => setNewsTitle(event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Description actualités</label>
            <textarea
              rows={3}
              className={inputClass}
              value={newsDescription}
              onChange={(event) => setNewsDescription(event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/super-admin/churches")}
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
          {isLoading
            ? "Enregistrement..."
            : isEditMode
              ? "Enregistrer les modifications"
              : "Créer l’église"}
        </button>
      </div>
    </form>
  );
}

function FilePicker({
  label,
  file,
  existingUrl,
  onChange,
}: {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState(existingUrl);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(existingUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file, existingUrl]);

  return (
    <div className="mt-2 rounded-2xl border border-dashed border-[#C9DBEA] bg-white p-4">
      {previewUrl ? (
        <div className="relative mb-4 h-40 overflow-hidden rounded-2xl bg-[#F8FBFD]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-contain p-3"
          />

          {file && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-3 top-3 rounded-full bg-white p-2 text-red-600 shadow"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-[#F8FBFD]">
          <ImageIcon className="h-10 w-10 text-[#3F79B3]" />
        </div>
      )}

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-4 text-center hover:bg-[#DCEAF5]">
        <UploadCloud className="h-6 w-6 text-[#03357A]" />

        <span className="mt-2 text-sm font-bold text-[#03357A]">{label}</span>

        <span className="mt-1 text-xs text-slate-500">
          {file ? file.name : "PNG, JPG ou WEBP — max 5 Mo"}
        </span>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            onChange(selectedFile);
          }}
        />
      </label>
    </div>
  );
}