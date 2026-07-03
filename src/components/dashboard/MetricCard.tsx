import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  accent?: "blue" | "purple" | "green" | "orange";
};

const accentClasses = {
  blue: "bg-[#EAF3FA] text-[#03357A]",
  purple: "bg-[#F1E8FF] text-[#8B5CF6]",
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "blue",
}: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accentClasses[accent]}`}>
            <Icon className="h-7 w-7" />
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-extrabold text-[#03357A]">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-sm font-medium text-[#3F79B3]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}