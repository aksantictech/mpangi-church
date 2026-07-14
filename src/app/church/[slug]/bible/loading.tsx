import { BookOpen } from "lucide-react";

export default function BibleLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4">
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#DCEAF5]">
        <BookOpen className="mx-auto h-10 w-10 animate-pulse text-[#03357A]" />
        <p className="mt-4 font-black text-[#03357A]">
          Ouverture de la Bible…
        </p>
      </div>
    </main>
  );
}
