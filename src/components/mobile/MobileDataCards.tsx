import type { ReactNode } from "react";

export type MobileDataCardField = {
  label: string;
  value: ReactNode;
};

type MobileDataCardsProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  getTitle: (item: T) => ReactNode;
  getFields: (item: T) => MobileDataCardField[];
  getActions?: (item: T) => ReactNode;
  emptyMessage?: string;
};

export default function MobileDataCards<T>({
  items,
  getKey,
  getTitle,
  getFields,
  getActions,
  emptyMessage = "Aucune donnée disponible.",
}: MobileDataCardsProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-[#F8FBFD] p-8 text-center text-sm font-bold text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:hidden">
      {items.map((item) => (
        <article
          key={getKey(item)}
          className="mobile-safe-text rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
        >
          <h3 className="break-words text-base font-black text-[#03357A]">
            {getTitle(item)}
          </h3>

          <dl className="mt-4 grid gap-3">
            {getFields(item).map((field) => (
              <div
                key={field.label}
                className="grid grid-cols-[110px_minmax(0,1fr)] gap-3"
              >
                <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {field.label}
                </dt>
                <dd className="min-w-0 break-words text-sm font-semibold text-slate-700">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>

          {getActions && (
            <div className="mobile-actions-stack mt-4">
              {getActions(item)}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
