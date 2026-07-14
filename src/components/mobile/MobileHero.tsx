import type { ReactNode } from "react";

type MobileHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function MobileHero({
  eyebrow,
  title,
  description,
  icon,
  actions,
  className = "",
}: MobileHeroProps) {
  return (
    <section
      className={[
        "mobile-compact-hero mobile-safe-text bg-gradient-to-br",
        "from-[#03357A] via-[#2563EB] to-[#8B5CF6]",
        "text-white shadow-xl shadow-blue-900/15",
        "sm:p-7",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {icon && (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              {icon}
            </div>
          )}

          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-2 max-w-full break-words text-3xl font-black sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-blue-50">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="mobile-actions-stack flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
