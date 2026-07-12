import type { LucideIcon } from "lucide-react";

export default function ExtensionKpiCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#03357A]">{value}</p>
          {description && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}
