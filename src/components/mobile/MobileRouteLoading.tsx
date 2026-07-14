import { LoaderCircle } from "lucide-react";

export default function MobileRouteLoading({
  title = "Chargement en cours",
  description = "Mpangi-church prépare cette page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="mobile-route-loading bg-[#F5F9FC]">
      <section className="mobile-route-loading-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-xl font-black text-[#03357A]">
              {title}
            </h1>

            <p className="mt-1 break-words text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="mobile-skeleton h-5 w-2/3" />
          <div className="mobile-skeleton h-20 w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="mobile-skeleton h-24" />
            <div className="mobile-skeleton h-24" />
            <div className="mobile-skeleton h-24" />
          </div>
        </div>
      </section>
    </main>
  );
}
