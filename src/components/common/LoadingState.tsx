import { Loader2 } from "lucide-react";

export default function LoadingState({
  label = "Chargement...",
}: {
  label?: string;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-8 text-center">
      <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#03357A]" />
      <p className="mt-4 text-sm font-black text-[#03357A]">{label}</p>
    </div>
  );
}
