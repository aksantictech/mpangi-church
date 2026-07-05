import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Download,
  HeartHandshake,
  LayoutDashboard,
  BookOpenText,
  QrCode,
  MessageSquareHeart,
  Globe,
  Settings,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

const menuItems = [
  {
    title: "Dashboard",
    description: "Vue générale de l’église",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Membres",
    description: "Liste, QR Codes, photos, import Excel",
    href: "/members",
    icon: Users,
  },
  {
    title: "Présences",
    description: "Pointage manuel et scanner QR",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Départements",
    description: "Services, ministères et affectations",
    href: "/departments",
    icon: Building2,
  },
  {
    title: "Événements",
    description: "Cultes, programmes et activités",
    href: "/events",
    icon: CalendarDays,
  },
  {
  title: "Publications",
  description: "Enseignements, vidéos, messages et annonces",
  href: "/publications",
  icon: BookOpenText,
},
  {
    title: "Suivi des âmes",
    description: "Accompagnement pastoral",
    href: "/souls",
    icon: HeartHandshake,
  },
  {
    title: "Demandes publiques",
    description: "Prières, rendez-vous, intégrations",
    href: "/public-requests",
    icon: MessageSquareHeart,
  },
  {
    title: "Témoignages",
    description: "Gestion des témoignages reçus",
    href: "/testimonies",
    icon: MessageSquareHeart,
  },
  {
    title: "Installer l’application",
    description: "Ajouter Mpangi-church sur le téléphone",
    href: "/install",
    icon: Download,
  },
  {
  title: "Page publique",
  description: "Nom public, dons, contacts et YouTube",
  href: "/settings/public-page",
  icon: Globe,
},
  {
    title: "Paramètres",
    description: "Compte, église et configuration",
    href: "/settings",
    icon: Settings,
  },
  {
  title: "QR ajout membre",
  description: "Lien public et QR Code d’ajout membre",
  href: "/settings/member-registration",
  icon: QrCode,
},
];

export default async function MobileMenuPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Menu mobile
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">Accès rapide</h1>

          <p className="mt-2 text-sm leading-7 text-blue-50">
            Retrouvez ici tous les modules principaux de l’application.
          </p>
        </section>

        <section className="grid gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[#03357A]">
                    {item.title}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03357A]" />
              </Link>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}