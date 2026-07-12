import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Icon className="h-7 w-7" />
            </div>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100 sm:text-sm">
                {eyebrow}
              </p>
            )}

            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
              {title}
            </h1>

            {description && (
              <p className="mt-2 max-w-4xl text-sm leading-7 text-blue-50">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
