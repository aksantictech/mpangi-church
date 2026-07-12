import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { notFound } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/security/access";
import ExtensionPageHeader from "@/components/extensions/ExtensionPageHeader";
import { updateExtensionAction } from "../../actions";

type EditExtensionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditExtensionPage({ params }: EditExtensionPageProps) {
  const { id } = await params;
  const { admin, churchId } = await requireChurchModuleAccess("extension_activities");

  const { data: extension } = await admin
    .from("church_extensions")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .maybeSingle();

  if (!extension) notFound();

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <Link
        href="/extensions"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux extensions
      </Link>

      <ExtensionPageHeader
        icon={Building2}
        title="Modifier l’extension"
        description="Mettez à jour les informations de l’extension."
      />

      <form action={updateExtensionAction} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
        <input type="hidden" name="id" value={extension.id} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Nom de l’extension *</span>
            <input
              name="name"
              required
              defaultValue={extension.name || ""}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Code</span>
            <input
              name="code"
              defaultValue={extension.code || ""}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Ville / Commune</span>
            <input
              name="city"
              defaultValue={extension.city || ""}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Statut</span>
            <select
              name="status"
              defaultValue={extension.status || "active"}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archivée</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-black text-[#03357A]">Adresse</span>
            <input
              name="address"
              defaultValue={extension.address || ""}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Responsable</span>
            <input
              name="responsible_name"
              defaultValue={extension.responsible_name || ""}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Téléphone responsable</span>
            <input
              name="responsible_phone"
              defaultValue={extension.responsible_phone || ""}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-black text-[#03357A]">Notes</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={extension.notes || ""}
              className="w-full rounded-2xl border border-[#DCEAF5] px-4 py-3 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/extensions"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-extrabold text-white"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
