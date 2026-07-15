"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Gift,
  HeartHandshake,
  Home,
} from "lucide-react";

export default function PublicMobileBottomNav({
  slug,
}: {
  slug: string;
}) {
  const pathname = usePathname();

  const items = [
    {
      label: "Accueil",
      href: `/church/${slug}`,
      icon: Home,
    },
    {
      label: "Prière",
      href: `/church/${slug}/prayer`,
      icon: HeartHandshake,
    },
    {
      label: "Bible",
      href: `/church/${slug}/bible`,
      icon: BookOpen,
    },
    {
      label: "Don",
      href: `/church/${slug}/don`,
      icon: Gift,
    },
    {
      label: "Notif",
      href: `/church/${slug}/notifications`,
      icon: Bell,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCEAF5] bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[10px] font-black",
                active
                  ? "bg-[#EAF3FA] text-[#03357A]"
                  : "text-slate-500",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
