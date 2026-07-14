import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Landmark,
  LayoutGrid,
  Settings2,
} from "lucide-react";
import {
  getAllowedNavigationItems,
  groupPermissionNavigation,
  type PermissionNavigationItem,
} from "@/lib/security/permissionNavigation";

const CATEGORY_META: Record<
  PermissionNavigationItem["category"],
  {
    label: string;
    icon: typeof LayoutGrid;
  }
> = {
  principal: {
    label: "Principal",
    icon: LayoutGrid,
  },
  spirituel: {
    label: "Vie de l’église",
    icon: BookOpenCheck,
  },
  administration: {
    label: "Administration",
    icon: BriefcaseBusiness,
  },
  finance: {
    label: "Finances",
    icon: Landmark,
  },
  patrimoine: {
    label: "Patrimoine",
    icon: Building2,
  },
  configuration: {
    label: "Configuration",
    icon: Settings2,
  },
};

export default async function PermissionModuleGrid() {
  const { context, items } =
    await getAllowedNavigationItems();

  const groups = groupPermissionNavigation(items);

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(
        ([category, categoryItems]) => {
          if (categoryItems.length === 0) {
            return null;
          }

          const meta =
            CATEGORY_META[
              category as PermissionNavigationItem["category"]
            ];

          const Icon = meta.icon;

          return (
            <section
              key={category}
              className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6"
            >
              <header className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-[#03357A]">
                    {meta.label}
                  </h2>

                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {categoryItems.length} accès autorisé
                    {categoryItems.length > 1 ? "s" : ""}
                  </p>
                </div>
              </header>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categoryItems.map((item) => (
                  <Link
                    key={`${item.code}:${item.href}`}
                    href={item.href}
                    className="group flex min-h-24 items-start justify-between gap-4 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <h3 className="break-words font-black text-[#03357A]">
                        {item.label}
                      </h3>

                      <p className="mt-2 break-all text-xs font-semibold text-slate-400">
                        {item.href}
                      </p>
                    </div>

                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#3F79B3] transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </section>
          );
        }
      )}

      {items.length === 0 && (
        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="font-black text-amber-800">
            Aucun module autorisé
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-700">
            Le rôle {context.role} ne possède actuellement aucun
            accès actif. Contactez l’administrateur de l’église.
          </p>
        </section>
      )}
    </div>
  );
}
