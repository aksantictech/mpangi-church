import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Une erreur est survenue",
  description = "Impossible de charger les données pour le moment.",
  retryHref,
}: {
  title?: string;
  description?: string;
  retryHref?: string;
}) {
  return (
    <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center text-red-800">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-700">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-lg font-black">{title}</h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 font-semibold">
        {description}
      </p>

      {retryHref && (
        <Link
          href={retryHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Link>
      )}
    </div>
  );
}
