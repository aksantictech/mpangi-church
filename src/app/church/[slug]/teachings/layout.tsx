import PublicChurchBackLink from "@/components/public/PublicChurchBackLink";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";

type PublicTeachingsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicTeachingsLayout({
  children,
  params,
}: PublicTeachingsLayoutProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#F5F9FC] pb-24 text-[#0F172A] lg:pb-8">
      <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6">
        <PublicChurchBackLink
          fallbackSlug={slug}
        />
      </div>

      {children}

      <PublicMobileBottomNav
        slug={slug}
      />
    </div>
  );
}
