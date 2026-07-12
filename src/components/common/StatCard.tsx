import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  footer,
}: {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: LucideIcon;
  footer?: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
          {description && (
            <p className="mt-1 text-sm leading-6 text-[#2563EB]">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <Icon className="h-7 w-7" />
          </div>
        )}
      </div>

      {footer && <div className="mt-4 border-t border-[#DCEAF5] pt-4">{footer}</div>}
    </article>
  );
}
