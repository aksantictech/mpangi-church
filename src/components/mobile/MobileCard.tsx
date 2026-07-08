import type { ReactNode } from "react";

export default function MobileCard({
  title,
  subtitle,
  meta,
  badge,
  children,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-[#03357A]">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          )}

          {meta && (
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              {meta}
            </p>
          )}
        </div>

        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {children && <div className="mt-4">{children}</div>}

      {actions && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#DCEAF5] pt-4">
          {actions}
        </div>
      )}
    </article>
  );
}
