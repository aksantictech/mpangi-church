import { LayoutGrid } from "lucide-react";
import PermissionModuleGrid from "@/components/security/PermissionModuleGrid";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

export default async function AllowedModulesPage() {
  const context = await getCurrentSecurityContext();

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <LayoutGrid className="h-8 w-8" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Navigation sécurisée
          </p>

          <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
            Mes modules autorisés
          </h1>

          <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-blue-50">
            {context.fullName}
            {context.churchName
              ? ` · ${context.churchName}`
              : ""}
          </p>
        </section>

        <div className="mt-5">
          <PermissionModuleGrid />
        </div>
      </div>
    </main>
  );
}
