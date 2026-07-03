import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function PublicHomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white/90 px-4 py-2 text-sm font-extrabold text-[#03357A] shadow-sm backdrop-blur hover:bg-[#EAF3FA]"
    >
      <ArrowLeft className="h-4 w-4" />
      <Home className="h-4 w-4" />
      Accueil principal
    </Link>
  );
}