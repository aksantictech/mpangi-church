import {
  Activity,
  Archive,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartHandshake,
  Landmark,
  LucideIcon,
  PackageCheck,
  PieChart,
  ShieldCheck,
  UsersRound,
  Wallet,
  Warehouse,
} from "lucide-react";

export type DashboardRole =
  | "super_admin"
  | "church_admin"
  | "pastor"
  | "assistant_pastor"
  | "admin_eglise"
  | "pasteur_t"
  | "pasteur_a"
  | "charge_afp"
  | "responsable_d"
  | "logisticien"
  | "secretaire"
  | "worker"
  | "readonly"
  | string;

export type DashboardCardCode =
  | "overview"
  | "members"
  | "attendance"
  | "souls"
  | "public_requests"
  | "events"
  | "departments"
  | "administration"
  | "appointments"
  | "finance"
  | "patrimony"
  | "maintenance"
  | "extensions"
  | "notifications";

export type RoleDashboardCard = {
  code: DashboardCardCode;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "violet" | "orange" | "slate";
};

export type RoleDashboardConfig = {
  role: DashboardRole;
  title: string;
  subtitle: string;
  focus: string;
  cards: RoleDashboardCard[];
};

const ALL_CARDS: Record<DashboardCardCode, RoleDashboardCard> = {
  overview: {
    code: "overview",
    title: "Vue globale",
    description: "Indicateurs essentiels de votre espace.",
    href: "/dashboard",
    icon: ShieldCheck,
    tone: "blue",
  },
  members: {
    code: "members",
    title: "Membres",
    description: "Membres, nouveaux venus et suivi des profils.",
    href: "/members",
    icon: UsersRound,
    tone: "blue",
  },
  attendance: {
    code: "attendance",
    title: "Présences",
    description: "Présences, scanner QR et rapports de participation.",
    href: "/attendance",
    icon: CalendarDays,
    tone: "green",
  },
  souls: {
    code: "souls",
    title: "Suivi des âmes",
    description: "Âmes suivies, accompagnement et alertes pastorales.",
    href: "/souls",
    icon: HeartHandshake,
    tone: "violet",
  },
  public_requests: {
    code: "public_requests",
    title: "Demandes publiques",
    description: "Prières, témoignages, rendez-vous et intégration.",
    href: "/public-requests",
    icon: Bell,
    tone: "orange",
  },
  events: {
    code: "events",
    title: "Événements",
    description: "Activités, cultes et agenda.",
    href: "/events",
    icon: CalendarDays,
    tone: "blue",
  },
  departments: {
    code: "departments",
    title: "Départements",
    description: "Départements, responsables et services.",
    href: "/departments",
    icon: Building2,
    tone: "blue",
  },
  administration: {
    code: "administration",
    title: "Administration",
    description: "Courriers, transmissions, tâches et PV.",
    href: "/administration/correspondence",
    icon: FileText,
    tone: "slate",
  },
  appointments: {
    code: "appointments",
    title: "Rendez-vous",
    description: "Rendez-vous pastoraux et administratifs.",
    href: "/appointments",
    icon: ClipboardList,
    tone: "orange",
  },
  finance: {
    code: "finance",
    title: "Finances",
    description: "Entrées, dépenses, budgets et rapports.",
    href: "/finance",
    icon: Wallet,
    tone: "green",
  },
  patrimony: {
    code: "patrimony",
    title: "Patrimoine",
    description: "Biens, maintenance et mouvements.",
    href: "/patrimony",
    icon: Warehouse,
    tone: "slate",
  },
  maintenance: {
    code: "maintenance",
    title: "Maintenance",
    description: "Suivi des maintenances et réparations.",
    href: "/patrimony/maintenance",
    icon: PackageCheck,
    tone: "orange",
  },
  extensions: {
    code: "extensions",
    title: "Extensions",
    description: "Rapports hebdomadaires des extensions.",
    href: "/extensions",
    icon: Activity,
    tone: "violet",
  },
  notifications: {
    code: "notifications",
    title: "Notifications",
    description: "Alertes et notifications envoyées.",
    href: "/notifications",
    icon: Bell,
    tone: "blue",
  },
};

const ROLE_CARD_MAP: Record<string, DashboardCardCode[]> = {
  super_admin: ["overview", "members", "attendance", "finance", "patrimony", "extensions", "administration"],
  church_admin: ["overview", "members", "attendance", "public_requests", "finance", "patrimony", "extensions", "administration"],
  admin_eglise: ["overview", "members", "attendance", "public_requests", "finance", "patrimony", "extensions", "administration"],
  pastor: ["overview", "members", "attendance", "souls", "public_requests", "events", "extensions"],
  pasteur_t: ["overview", "members", "attendance", "souls", "public_requests", "events", "extensions"],
  assistant_pastor: ["overview", "attendance", "souls", "events", "public_requests"],
  pasteur_a: ["overview", "attendance", "souls", "events", "public_requests"],
  charge_afp: ["overview", "administration", "finance", "patrimony", "extensions"],
  responsable_d: ["overview", "departments", "members", "attendance"],
  logisticien: ["overview", "patrimony", "maintenance"],
  secretaire: ["overview", "administration", "appointments", "public_requests", "extensions"],
  worker: ["overview", "members", "attendance", "events"],
  readonly: ["overview", "members"],
};

const ROLE_LABELS: Record<string, { title: string; subtitle: string; focus: string }> = {
  super_admin: {
    title: "Dashboard Super Admin",
    subtitle: "Pilotage global de la plateforme multi-églises.",
    focus: "Vue globale, églises, modules et supervision.",
  },
  church_admin: {
    title: "Dashboard Administrateur église",
    subtitle: "Vue complète pour gérer l’espace de l’église.",
    focus: "Membres, demandes, finances, patrimoine et administration.",
  },
  admin_eglise: {
    title: "Dashboard Administrateur église",
    subtitle: "Vue complète pour gérer l’espace de l’église.",
    focus: "Membres, demandes, finances, patrimoine et administration.",
  },
  pastor: {
    title: "Dashboard pastoral",
    subtitle: "Priorité au suivi spirituel et à la vie de l’église.",
    focus: "Âmes, présences, demandes publiques et événements.",
  },
  pasteur_t: {
    title: "Dashboard Pasteur titulaire",
    subtitle: "Pilotage pastoral et vision globale de l’église.",
    focus: "Suivi des âmes, présences, demandes et extensions.",
  },
  pasteur_a: {
    title: "Dashboard Pasteur assistant",
    subtitle: "Suivi opérationnel pastoral.",
    focus: "Présences, événements, âmes et demandes.",
  },
  charge_afp: {
    title: "Dashboard Chargé AFP",
    subtitle: "Administration, finances et patrimoine.",
    focus: "Administration, finances, patrimoine et extensions.",
  },
  responsable_d: {
    title: "Dashboard Responsable département",
    subtitle: "Suivi des départements, membres et présences.",
    focus: "Départements, membres et participation.",
  },
  logisticien: {
    title: "Dashboard Logisticien",
    subtitle: "Gestion du patrimoine et de la maintenance.",
    focus: "Biens, mouvements et maintenance.",
  },
  secretaire: {
    title: "Dashboard Secrétaire",
    subtitle: "Suivi administratif quotidien.",
    focus: "Courriers, rendez-vous, demandes et extensions.",
  },
  readonly: {
    title: "Dashboard lecture seule",
    subtitle: "Consultation limitée des informations autorisées.",
    focus: "Vue simple et sécurisée.",
  },
};

export function normalizeDashboardRole(role?: string | null): DashboardRole {
  if (!role) return "readonly";
  return role.trim().toLowerCase();
}

export function getRoleDashboardConfig(role?: string | null): RoleDashboardConfig {
  const normalized = normalizeDashboardRole(role);
  const cardCodes = ROLE_CARD_MAP[normalized] ?? ROLE_CARD_MAP.readonly;
  const labels = ROLE_LABELS[normalized] ?? ROLE_LABELS.readonly;

  return {
    role: normalized,
    title: labels.title,
    subtitle: labels.subtitle,
    focus: labels.focus,
    cards: cardCodes.map((code) => ALL_CARDS[code]).filter(Boolean),
  };
}

export function getDashboardCardLabel(code: string) {
  return ALL_CARDS[code as DashboardCardCode]?.title ?? code;
}
