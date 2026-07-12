import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Aucune donnée",
  description = "Aucun élément trouvé pour le moment.",
  actionLabel,
  actionHref,
  icon: Icon = Inbox,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-[#F8FBFD] p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-lg font-black text-[#03357A]">{title}</h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
