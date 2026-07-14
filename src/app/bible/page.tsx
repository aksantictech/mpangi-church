import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BibleReaderClient from "@/components/bible/BibleReaderClient";

export const metadata = {
  title: "Lire la Bible | Mpangi-church",
  description:
    "Lecteur biblique français intégré à la plateforme Mpangi-church.",
};

export default function BiblePage() {
  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8 lg:pb-8">
      <div className="mx-auto mb-4 max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
      </div>

      <BibleReaderClient />
    </main>
  );
}
