import { Loader2 } from "lucide-react";

export default function RouteLoadingView({
  label = "Chargement de la page...",
}: {
  label?: string;
}) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-[2rem] border border-[#DCEAF5] bg-white p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#03357A]" />
        <p className="mt-4 text-sm font-black text-[#03357A]">{label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Merci de patienter pendant la préparation des données.
        </p>
      </div>
    </section>
  );
}
