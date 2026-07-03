"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe2, ImageIcon, MapPin, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#C9DBEA] bg-white px-4 py-3 text-[#0F172A] placeholder:text-slate-400 outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-semibold text-[#03357A]";

export default function ChurchForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [serviceTimes, setServiceTimes] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const cleanSlug = generateSlug(slug || name);

    if (!name.trim()) {
      setErrorMessage("Le nom de l’église est obligatoire.");
      setIsLoading(false);
      return;
    }

    if (!cleanSlug) {
      setErrorMessage("Le slug public est obligatoire.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.rpc("create_church_as_super_admin", {
      _name: name.trim(),
      _slug: cleanSlug,
      _address: address.trim(),
      _city: city.trim(),
      _country: country.trim(),
      _phone: phone.trim(),
      _whatsapp: whatsapp.trim(),
      _email: email.trim(),
      _service_times: serviceTimes.trim(),
      _logo_url: logoUrl.trim(),
      _cover_image_url: coverImageUrl.trim(),
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage("Église créée avec succès.");

    setTimeout(() => {
      router.push("/super-admin/churches");
      router.refresh();
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#03357A] p-3 text-white">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#03357A]">
              Informations principales
            </h2>
            <p className="text-sm text-slate-500">
              Identité de l’église dans Mpangi-Church.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <label className={labelClass}>Nom de l’église *</label>
            <input
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className={inputClass}
              placeholder="Exemple : Impact Centre Chrétien"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Slug public *</label>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(generateSlug(event.target.value))}
              className={inputClass}
              placeholder="impact-centre-chretien"
              required
            />
            <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#3F79B3]">
              Lien public : /church/{slug || "nom-eglise"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#3F79B3] p-3 text-white">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#03357A]">
              Adresse et localisation
            </h2>
            <p className="text-sm text-slate-500">
              Ces informations apparaîtront sur la page publique.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Ville</label>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={inputClass}
              placeholder="Kinshasa"
            />
          </div>

          <div>
            <label className={labelClass}>Pays</label>
            <input
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={inputClass}
              placeholder="RD Congo"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Adresse complète</label>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={inputClass}
              placeholder="Rue, commune, quartier..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#6D9FC7] p-3 text-white">
            <Phone className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#03357A]">
              Contacts et horaires
            </h2>
            <p className="text-sm text-slate-500">
              Téléphone, WhatsApp, email et horaires des cultes.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
              placeholder="+243..."
            />
          </div>

          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              className={inputClass}
              placeholder="+243..."
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="contact@eglise.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Horaires des cultes</label>
            <textarea
              value={serviceTimes}
              onChange={(event) => setServiceTimes(event.target.value)}
              rows={4}
              className={inputClass}
              placeholder={"Dimanche : 09h00 - 12h00\nMercredi : 18h00 - 20h00"}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#C085D1] p-3 text-white">
            <ImageIcon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#03357A]">
              Images publiques
            </h2>
            <p className="text-sm text-slate-500">
              Logo et photo principale de l’église.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>URL logo</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className={labelClass}>URL photo de l’église</label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/super-admin/churches")}
          className="rounded-xl border border-[#C9DBEA] px-5 py-3 font-semibold text-[#03357A] hover:bg-[#EAF3FA]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-[#03357A] px-6 py-3 font-semibold text-white hover:bg-[#29417E] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Création en cours..." : "Créer l’église"}
        </button>
      </div>
    </form>
  );
}