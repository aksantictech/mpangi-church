import Link from "next/link";
import { ArrowLeft, Church } from "lucide-react";
import PublicHomeLink from "@/components/public/PublicHomeLink";
type PublicFormLayoutProps = {
  churchName: string;
  churchSlug: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

export default function PublicFormLayout({
  churchName,
  churchSlug,
  title,
  description,
  icon,
  children,
}: PublicFormLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F5F9FC] text-[#0F172A]">
      <div className="pointer-events-none fixed left-0 top-0 h-72 w-72 rounded-full bg-[#6D9FC7]/20 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-96 w-96 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
<div className="mx-auto max-w-3xl px-4 pt-5">
  <PublicHomeLink />
</div>
      <section className="relative mx-auto flex min-h-screen max-w-4xl items-center px-4 py-8 md:px-6">
        <div className="w-full">
          <Link
            href={`/church/${churchSlug}`}
            className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-4 py-2 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la page de l’église
          </Link>

          <div className="overflow-hidden rounded-[2rem] border border-[#DCEAF5] bg-white shadow-xl shadow-blue-950/5">
            <div className="bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                  {icon}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                    {churchName}
                  </p>

                  <h1 className="mt-2 text-3xl font-extrabold">
                    {title}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8">{children}</div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Powered by{" "}
            <span className="font-bold text-[#03357A]">AKSANTIC</span>{" "}
            <span className="text-[#8B5CF6]">Technology</span>
          </p>
        </div>
      </section>
    </main>
  );
}