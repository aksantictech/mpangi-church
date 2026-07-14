import Link from "next/link";
import {
  ClipboardCheck,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

export default function RoleQuickLinks({
  canManageRoles = false,
}: {
  canManageRoles?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <QuickLink
        href="/dashboard/role"
        icon={LayoutDashboard}
        title="Dashboard personnalisé"
        description="Vue adaptée à votre rôle."
      />

      <QuickLink
        href="/my-work"
        icon={ClipboardCheck}
        title="Mon travail"
        description="Missions et tâches personnelles."
      />

      {canManageRoles && (
        <QuickLink
          href="/settings/roles"
          icon={ShieldCheck}
          title="Rôles et accès"
          description="Configurer les permissions."
        />
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#DCEAF5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5"
    >
      <Icon className="h-6 w-6 text-[#03357A]" />
      <h3 className="mt-4 font-black text-[#03357A]">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  );
}
