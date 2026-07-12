import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function ExtensionPageHeader({
  eyebrow = "Volet extensions",
  title,
  description,
  icon: Icon,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[1.7rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100 sm:text-sm">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
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
