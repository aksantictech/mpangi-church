"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type PublicChurchBackLinkProps = {
  fallbackSlug?: string | null;
};

function getSlugFromPathname(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "church" && parts[1]) {
    return parts[1];
  }

  return null;
}

export default function PublicChurchBackLink({
  fallbackSlug,
}: PublicChurchBackLinkProps) {
  const pathname = usePathname();

  const slug = fallbackSlug || getSlugFromPathname(pathname);

  if (!slug) {
    return null;
  }

  return (
    <Link
      href={`/church/${slug}`}
      className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour à la page de l’église
    </Link>
  );
}