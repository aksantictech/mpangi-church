import type { ReactNode } from "react";
import PublicChurchBackLink from "@/components/public/PublicChurchBackLink";

type PublicChurch = {
  id?: string;
  name?: string | null;
  public_name?: string | null;
  slug?: string | null;
};

type PublicFormLayoutProps = {
  church?: PublicChurch | null;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

function getPublicChurchName(church?: PublicChurch | null) {
  const publicName = church?.public_name?.trim();

  if (publicName) {
    return publicName;
  }

  const name = church?.name?.trim();

  if (!name) {
    return "Église";
  }

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}

export default function PublicFormLayout({
  church,
  title,
  description,
  icon,
  children,
}: PublicFormLayoutProps) {
  const churchName = getPublicChurchName(church);

  return (
    <main className="min-h-screen bg-[#F5F9FC] text-[#0F172A]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#3F79B3]/15 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-96 w-96 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-5xl px-4 py-8">
        <PublicChurchBackLink fallbackSlug={church?.slug} />

        <div className="overflow-hidden rounded-[2rem] border border-[#DCEAF5] bg-white shadow-xl shadow-blue-950/5">
          <div className="bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15">
                {icon}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  {churchName}
                </p>

                <h1 className="mt-2 text-3xl font-black md:text-4xl">
                  {title}
                </h1>

                <p className="mt-3 text-sm leading-7 text-blue-50 md:text-base">
                  {description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">{children}</div>
        </div>
      </section>
    </main>
  );
}