import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Home,
  MapPinned,
  Plus,
} from "lucide-react";

const links = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    tone: "soft",
  },
  {
    label: "Extensions",
    href: "/extensions",
    icon: MapPinned,
    tone: "default",
  },
  {
    label: "Activités",
    href: "/extensions/activities",
    icon: Activity,
    tone: "default",
  },
  {
    label: "Synthèse",
    href: "/extensions/reports",
    icon: BarChart3,
    tone: "default",
  },
  {
    label: "Nouvelle activité",
    href: "/extensions/activities/new",
    icon: Plus,
    tone: "primary",
  },
];

export default function ExtensionsModuleNav() {
  return (
    <nav className="rounded-3xl border border-[#DCEAF5] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-black text-[#03357A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour dashboard
        </Link>

        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
          {links.slice(1).map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ${
                  item.tone === "primary"
                    ? "bg-[#03357A] text-white"
                    : "bg-[#F8FBFD] text-[#03357A] hover:bg-[#EAF3FA]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
