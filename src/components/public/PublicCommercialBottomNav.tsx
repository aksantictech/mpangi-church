import Link from "next/link";
import {
  LayoutDashboard,
  MessageCircle,
  Network,
  Presentation,
  Wallet,
} from "lucide-react";

const ITEMS = [
  {
    label: "Accueil",
    href: "#top",
    icon: LayoutDashboard,
  },
  {
    label: "Modules",
    href: "#modules",
    icon: Network,
  },
  {
    label: "Démo",
    href: "#demo",
    icon: Presentation,
    featured: true,
  },
  {
    label: "Forfaits",
    href: "/pricing",
    icon: Wallet,
  },
  {
    label: "Contact",
    href: "#contact",
    icon: MessageCircle,
  },
];

export default function PublicCommercialBottomNav() {
  return (
    <nav
      data-mpangi-public-commercial-nav
      role="navigation"
      aria-label="Navigation commerciale mobile"
      className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-[max(env(safe-area-inset-bottom),0.65rem)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end gap-1.5 rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_-8px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        {ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.featured) {
            return (
              <a
                key={item.href}
                href={item.href}
                aria-label="Demander une démonstration"
                className="group relative -mt-8 flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span className="flex h-[3.8rem] w-[3.8rem] items-center justify-center rounded-full border-[5px] border-white bg-[#2563EB] text-white shadow-xl transition-transform group-active:scale-95">
                  <Icon className="h-6 w-6" />
                </span>

                <span className="mt-1 text-[10px] font-black text-[#03357A]">
                  Démo
                </span>
              </a>
            );
          }

          const className = [
            "flex min-h-14 min-w-0 flex-1",
            "flex-col items-center justify-center",
            "gap-1 rounded-2xl px-1",
            "text-center text-[10px] font-black",
            "text-slate-500 transition-all",
            "hover:bg-slate-50",
          ].join(" ");

          if (item.href.startsWith("#")) {
            return (
              <a
                key={item.href}
                href={item.href}
                className={className}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}