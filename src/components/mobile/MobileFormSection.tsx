import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function MobileFormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-lg font-black text-[#03357A]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}
