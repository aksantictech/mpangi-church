import type { ReactNode } from "react";

export default function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
      {(title || description || action) && (
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            {title && (
              <h2 className="text-xl font-black text-[#03357A]">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}
