import type { ReactNode } from "react";

type MobileSectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function MobileSection({
  title,
  description,
  action,
  children,
  className = "",
}: MobileSectionProps) {
  return (
    <section
      className={[
        "mobile-safe-text rounded-[1.5rem] border border-[#DCEAF5]",
        "bg-white p-4 shadow-sm sm:p-6",
        className,
      ].join(" ")}
    >
      {(title || description || action) && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="break-words text-xl font-black text-[#03357A] sm:text-2xl">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}

      {children}
    </section>
  );
}
