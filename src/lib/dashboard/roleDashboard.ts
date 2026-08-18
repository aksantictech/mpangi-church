import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentSecurityContext,
  getCurrentRolePermissions,
} from "@/lib/security/permissionEngine";
import {
  getModuleDefinition,
  getRoleLabel,
  normalizeRoleCode,
} from "@/lib/security/roleCatalog";

type WidgetDefinition = {
  code: string;
  title: string;
  description: string;
  moduleCode: string;
  href: string;
};

const WIDGETS: Record<string, WidgetDefinition> = {
  overview: {
    code: "overview",
    title: "Vue d’ensemble",
    description: "Accédez aux priorités de votre rôle.",
    moduleCode: "role_dashboard",
    href: "/dashboard/role",
  },
  members: {
    code: "members",
    title: "Membres",
    description: "Consultez et accompagnez les membres.",
    moduleCode: "members",
    href: "/members",
  },
  attendance: {
    code: "attendance",
    title: "Présences",
    description: "Suivez les présences et le scanner QR.",
    moduleCode: "attendance",
    href: "/attendance",
  },
  souls: {
    code: "souls",
    title: "Suivi des âmes",
    description: "Consultez les suivis pastoraux prioritaires.",
    moduleCode: "souls",
    href: "/souls",
  },
  public_requests: {
    code: "public_requests",
    title: "Demandes publiques",
    description: "Prières, rendez-vous et témoignages reçus.",
    moduleCode: "public_requests",
    href: "/public-requests",
  },
  tasks: {
    code: "tasks",
    title: "Mon travail",
    description: "Traitez les missions liées à votre rôle.",
    moduleCode: "my_work",
    href: "/my-work",
  },
  finance: {
    code: "finance",
    title: "Finances",
    description: "Consultez les opérations et rapports financiers.",
    moduleCode: "finance_dashboard",
    href: "/finance",
  },
  donations: {
    code: "donations",
    title: "Dons reçus",
    description: "Vérifiez et confirmez les intentions de dons.",
    moduleCode: "donations",
    href: "/finance/donations",
  },
  departments: {
    code: "departments",
    title: "Départements",
    description: "Pilotez les équipes et activités.",
    moduleCode: "departments",
    href: "/departments",
  },
  patrimony: {
    code: "patrimony",
    title: "Patrimoine",
    description: "Suivez les biens, mouvements et maintenances.",
    moduleCode: "patrimony_dashboard",
    href: "/patrimony",
  },
  maintenance: {
    code: "maintenance",
    title: "Maintenance",
    description: "Traitez les opérations de maintenance.",
    moduleCode: "asset_maintenance",
    href: "/patrimony/maintenance",
  },
  correspondence: {
    code: "correspondence",
    title: "Courriers",
    description: "Traitez les courriers administratifs.",
    moduleCode: "correspondence",
    href: "/administration/correspondence",
  },
  minutes: {
    code: "minutes",
    title: "Procès-verbaux",
    description: "Préparez et suivez les PV.",
    moduleCode: "meetings_minutes",
    href: "/administration/minutes",
  },
  transmissions: {
    code: "transmissions",
    title: "Transmissions",
    description: "Suivez les documents transmis.",
    moduleCode: "document_transmissions",
    href: "/administration/transmissions",
  },
  security: {
    code: "security",
    title: "Rôles et accès",
    description: "Contrôlez les autorisations de l’église.",
    moduleCode: "security",
    href: "/settings/roles",
  },
  users: {
    code: "users",
    title: "Utilisateurs",
    description: "Créez et administrez les comptes.",
    moduleCode: "users",
    href: "/settings/users",
  },
  churches: {
    code: "churches",
    title: "Églises",
    description: "Consultez les églises de la plateforme.",
    moduleCode: "security",
    href: "/super-admin/churches",
  },
};

async function safeCount(
  table: string,
  churchId: string,
  extra?: (query: any) => any
) {
  const admin = createAdminClient();

  let query = admin
    .from(table)
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("church_id", churchId);

  if (extra) query = extra(query);

  const { count, error } = await query;

  if (error) return null;

  return count ?? 0;
}

export async function getRoleDashboardData() {
  const context = await getCurrentSecurityContext();

  if (!context.churchId) {
    return {
      context,
      roleLabel: getRoleLabel(context.role),
      widgets: [],
      metrics: {},
    };
  }

  const admin = createAdminClient();
  const normalizedRole = normalizeRoleCode(context.role);

  const [{ data: widgetRows }, permissions] = await Promise.all([
    admin
      .from("church_role_dashboard_widgets")
      .select("widget_code, position, is_enabled")
      .eq("church_id", context.churchId)
      .eq("role_code", normalizedRole)
      .eq("is_enabled", true)
      .order("position", { ascending: true }),
    getCurrentRolePermissions(),
  ]);

  const allowedModules = new Set(
    permissions
      .filter(
        (permission) =>
          permission.is_enabled && permission.can_view
      )
      .map((permission) => permission.module_code)
  );

  if (normalizedRole === "super_admin") {
    Object.values(WIDGETS).forEach((widget) =>
      allowedModules.add(widget.moduleCode)
    );
  }

  const widgets = (widgetRows || [])
    .map((row) => WIDGETS[row.widget_code])
    .filter(Boolean)
    .filter(
      (widget) =>
        widget.code === "overview" ||
        allowedModules.has(widget.moduleCode)
    );

  const [members, openTasks, pendingDonations, soulFollowups] =
    await Promise.all([
      safeCount("members", context.churchId),
      safeCount(
        "church_user_role_tasks",
        context.churchId,
        (query) =>
          query
            .eq("assigned_to", context.userId)
            .in("status", ["todo", "in_progress", "blocked"])
      ),
      safeCount(
        "church_donations",
        context.churchId,
        (query) =>
          query.in("status", [
            "pending",
            "awaiting_payment",
            "submitted",
          ])
      ),
      safeCount("soul_followups", context.churchId),
    ]);

  return {
    context,
    roleLabel: getRoleLabel(context.role),
    widgets,
    metrics: {
      members,
      openTasks,
      pendingDonations,
      soulFollowups,
    },
  };
}

export function resolveModuleLink(moduleCode: string) {
  return getModuleDefinition(moduleCode);
}

export type LegacyRoleDashboardCard = {
  code: string;
  title: string;
  description: string;
  href: string;
  metricKey: string;
  moduleCode: string;
  tone: string;
  [key: string]: any;
};

export type LegacyRoleDashboardBaseConfig = {
  title: string;
  subtitle: string;
  focus: string;
  metrics: string[];
  widgets: string[];
  quickActions: any[];
  sections: any[];
};

export type LegacyRoleDashboardConfig =
  LegacyRoleDashboardBaseConfig & {
    role: string;
    cards: LegacyRoleDashboardCard[];
    [key: string]: any;
  };

function readLegacyRoleCode(roleInput?: unknown) {
  if (
    roleInput &&
    typeof roleInput === "object" &&
    "role" in roleInput
  ) {
    return String(
      (roleInput as { role?: unknown }).role || "readonly"
    )
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  return String(roleInput || "readonly")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

const LEGACY_CARD_META: Record<
  string,
  { title: string; description: string; href: string; tone: string }
> = {
  churches: {
    title: "Églises",
    description: "Églises enregistrées sur la plateforme.",
    href: "/super-admin/churches",
    tone: "blue",
  },
  users: {
    title: "Utilisateurs",
    description: "Comptes utilisateurs gérés.",
    href: "/settings/users",
    tone: "blue",
  },
  security: {
    title: "Sécurité",
    description: "Rôles et autorisations.",
    href: "/settings/roles",
    tone: "violet",
  },
  activity: {
    title: "Activité",
    description: "Activité générale de la plateforme.",
    href: "/dashboard/role",
    tone: "blue",
  },
  members: {
    title: "Membres",
    description: "Membres accessibles pour votre rôle.",
    href: "/members",
    tone: "blue",
  },
  attendance: {
    title: "Présences",
    description: "Présences enregistrées ce mois.",
    href: "/attendance",
    tone: "green",
  },
  public_requests: {
    title: "Demandes publiques",
    description: "Demandes publiques en attente de traitement.",
    href: "/public-requests",
    tone: "violet",
  },
  tasks: {
    title: "Tâches ouvertes",
    description: "Missions qui vous sont actuellement attribuées.",
    href: "/my-work",
    tone: "orange",
  },
  souls: {
    title: "Âmes suivies",
    description: "Suivis pastoraux enregistrés.",
    href: "/souls",
    tone: "violet",
  },
  offerings: {
    title: "Offrandes",
    description: "Opérations d'offrandes de la période.",
    href: "/finance/offerings",
    tone: "green",
  },
  expenses: {
    title: "Dépenses",
    description: "Dépenses du mois en cours.",
    href: "/finance/expenses",
    tone: "orange",
  },
  donations: {
    title: "Dons",
    description: "Dons à contrôler ou confirmer.",
    href: "/finance/donations",
    tone: "green",
  },
  events: {
    title: "Activités",
    description: "Activités et événements enregistrés.",
    href: "/events",
    tone: "blue",
  },
  assets: {
    title: "Biens",
    description: "Biens suivis dans le patrimoine.",
    href: "/patrimony/assets",
    tone: "blue",
  },
  maintenance: {
    title: "Maintenances",
    description: "Opérations de maintenance à suivre.",
    href: "/patrimony/maintenance",
    tone: "orange",
  },
  movements: {
    title: "Mouvements",
    description: "Mouvements de biens enregistrés.",
    href: "/patrimony/movements",
    tone: "blue",
  },
  correspondence: {
    title: "Courriers",
    description: "Courriers administratifs à traiter.",
    href: "/administration/correspondence",
    tone: "blue",
  },
  transmissions: {
    title: "Transmissions",
    description: "Documents transmis et reçus.",
    href: "/administration/transmissions",
    tone: "blue",
  },
  minutes: {
    title: "Procès-verbaux",
    description: "Procès-verbaux et réunions à suivre.",
    href: "/administration/minutes",
    tone: "blue",
  },
  department_members: {
    title: "Membres du département",
    description: "Membres actifs rattachés à votre département.",
    href: "/departments",
    tone: "blue",
  },
  department_attendance: {
    title: "Présences du département",
    description: "Présences enregistrées ce mois pour votre département.",
    href: "/attendance",
    tone: "green",
  },
  department_activities: {
    title: "Activités du département",
    description: "Activités représentées par les présences du département ce mois.",
    href: "/reports/departments",
    tone: "violet",
  },
  department_reports: {
    title: "Rapports transmis",
    description: "Rapports du département déjà envoyés.",
    href: "/reports/departments",
    tone: "green",
  },
};

function humanizeLegacyCode(code: string) {
  const metadata = LEGACY_CARD_META[code];
  if (metadata) return metadata.title;

  return code
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function legacyHrefForCode(code: string) {
  return LEGACY_CARD_META[code]?.href || "/dashboard/role";
}

function createLegacyCards(
  metrics: string[]
): LegacyRoleDashboardCard[] {
  return metrics.map((code) => {
    const metadata = LEGACY_CARD_META[code];

    return {
      code,
      title: metadata?.title || humanizeLegacyCode(code),
      description:
        metadata?.description ||
        `Indicateur ${humanizeLegacyCode(code).toLowerCase()}.`,
      href: metadata?.href || legacyHrefForCode(code),
      metricKey: code,
      moduleCode: code,
      tone: metadata?.tone || "blue",
    };
  });
}

/**
 * Contrat définitif de compatibilité avec :
 * src/app/api/dashboard/role/route.ts
 *
 * Cette fonction est volontairement synchrone. Elle retourne toujours
 * les propriétés attendues par l'ancienne route, notamment cards[].
 */
export function getRoleDashboardConfig(
  roleInput?: unknown
): LegacyRoleDashboardConfig {
  const rawRole = readLegacyRoleCode(roleInput);

  const aliases: Record<string, string> = {
    admin: "church_admin",
    admin_eglise: "church_admin",
    church_admin: "church_admin",
    pasteur: "pasteur_t",
    pasteur_titulaire: "pasteur_t",
    pastor_titulaire: "pasteur_t",
    pasteur_t: "pasteur_t",
    pastor: "pasteur_t",
    pasteur_assistant: "pasteur_a",
    pastor_assistant: "pasteur_a",
    assistant_pastor: "pasteur_a",
    pasteur_a: "pasteur_a",
    charge_afp: "charge_afp",
    responsable_d: "responsable_d",
    department_leader: "responsable_d",
    logisticien: "logisticien",
    secretary: "secretaire",
    secretaire: "secretaire",
    worker: "worker",
    readonly: "readonly",
    viewer: "readonly",
    member: "member",
    super_admin: "super_admin",
  };

  const role = aliases[rawRole] || rawRole || "readonly";

  const defaults: Record<string, LegacyRoleDashboardBaseConfig> = {
    super_admin: {
      title: "Pilotage de la plateforme",
      subtitle:
        "Supervision globale des églises, utilisateurs et accès.",
      focus: "Gouvernance et sécurité",
      metrics: ["churches", "users", "security", "activity"],
      widgets: ["overview", "security", "users", "churches"],
      quickActions: [
        "/super-admin/churches",
        "/super-admin/users",
        "/super-admin/security",
      ],
      sections: ["overview", "management", "security"],
    },

    church_admin: {
      title: "Administration de l’église",
      subtitle:
        "Suivez les membres, activités, demandes et opérations.",
      focus: "Coordination générale",
      metrics: [
        "members",
        "attendance",
        "public_requests",
        "tasks",
      ],
      widgets: [
        "overview",
        "members",
        "attendance",
        "public_requests",
        "tasks",
        "finance",
      ],
      quickActions: [
        "/members",
        "/public-requests",
        "/settings/users",
      ],
      sections: ["overview", "operations", "administration"],
    },

    pasteur_t: {
      title: "Pilotage pastoral",
      subtitle:
        "Suivez les âmes, les demandes et les priorités ministérielles.",
      focus: "Accompagnement pastoral",
      metrics: [
        "souls",
        "public_requests",
        "attendance",
        "tasks",
      ],
      widgets: [
        "overview",
        "souls",
        "public_requests",
        "attendance",
        "tasks",
      ],
      quickActions: ["/souls", "/public-requests", "/events"],
      sections: ["pastoral", "followup", "activities"],
    },

    pastor: {
      title: "Dashboard pastoral",
      subtitle:
        "Suivez les actions et demandes pastorales.",
      focus: "Accompagnement pastoral",
      metrics: ["souls", "public_requests", "tasks"],
      widgets: [
        "overview",
        "souls",
        "public_requests",
        "tasks",
      ],
      quickActions: ["/souls", "/public-requests"],
      sections: ["pastoral", "followup"],
    },

    pasteur_a: {
      title: "Missions pastorales",
      subtitle:
        "Traitez les suivis et activités qui vous sont confiés.",
      focus: "Suivi pastoral",
      metrics: ["souls", "attendance", "tasks"],
      widgets: [
        "souls",
        "attendance",
        "tasks",
      ],
      quickActions: ["/souls", "/my-work"],
      sections: ["followup", "tasks"],
    },

    charge_afp: {
      title: "Administration, finances et patrimoine",
      subtitle:
        "Contrôlez les opérations financières et les pièces associées.",
      focus: "Gestion financière",
      metrics: [
        "offerings",
        "expenses",
        "donations",
        "tasks",
      ],
      widgets: ["finance", "donations", "tasks"],
      quickActions: [
        "/finance",
        "/finance/donations",
        "/finance/reports",
      ],
      sections: ["finance", "controls", "reports"],
    },

    responsable_d: {
      title: "Situation de mon département",
      subtitle:
        "Suivez uniquement les membres, présences, activités, rapports et tâches de votre département.",
      focus: "Coordination du département",
      metrics: [
        "department_members",
        "department_attendance",
        "department_activities",
        "department_reports",
        "tasks",
      ],
      widgets: [
        "departments",
        "attendance",
        "tasks",
      ],
      quickActions: [
        "/reports/departments",
        "/attendance",
        "/my-work",
      ],
      sections: ["department", "attendance", "reports", "tasks"],
    },

    logisticien: {
      title: "Gestion logistique",
      subtitle:
        "Suivez les biens, mouvements et maintenances.",
      focus: "Patrimoine et logistique",
      metrics: ["assets", "maintenance", "movements", "tasks"],
      widgets: ["patrimony", "maintenance", "tasks"],
      quickActions: [
        "/patrimony",
        "/patrimony/maintenance",
        "/my-work",
      ],
      sections: ["assets", "maintenance", "movements"],
    },

    secretaire: {
      title: "Secrétariat administratif",
      subtitle:
        "Traitez les courriers, transmissions et procès-verbaux.",
      focus: "Administration documentaire",
      metrics: [
        "correspondence",
        "transmissions",
        "minutes",
        "tasks",
      ],
      widgets: [
        "correspondence",
        "minutes",
        "transmissions",
        "tasks",
      ],
      quickActions: [
        "/administration/correspondence",
        "/administration/transmissions",
        "/administration/minutes",
      ],
      sections: ["correspondence", "minutes", "tasks"],
    },

    worker: {
      title: "Mes activités",
      subtitle:
        "Consultez les tâches et présences qui vous concernent.",
      focus: "Exécution des missions",
      metrics: ["tasks", "attendance"],
      widgets: ["tasks", "attendance", "members"],
      quickActions: ["/my-work", "/attendance"],
      sections: ["tasks", "attendance"],
    },

    member: {
      title: "Mon espace",
      subtitle:
        "Consultez vos activités et informations utiles.",
      focus: "Participation",
      metrics: ["tasks"],
      widgets: ["overview", "tasks"],
      quickActions: ["/my-work", "/teachings"],
      sections: ["overview", "tasks"],
    },

    readonly: {
      title: "Consultation",
      subtitle:
        "Consultez les informations autorisées pour votre compte.",
      focus: "Lecture seule",
      metrics: [],
      widgets: ["overview", "members"],
      quickActions: [],
      sections: ["overview"],
    },
  };

  const config: LegacyRoleDashboardBaseConfig =
    defaults[role] ?? defaults.readonly;
  const metrics = Array.isArray(config.metrics)
    ? config.metrics
    : [];

  return {
    role,
    title: config.title,
    subtitle: config.subtitle,
    focus: config.focus,
    metrics,
    widgets: Array.isArray(config.widgets)
      ? config.widgets
      : [],
    quickActions: Array.isArray(config.quickActions)
      ? config.quickActions
      : [],
    sections: Array.isArray(config.sections)
      ? config.sections
      : [],
    cards: createLegacyCards(metrics),
  };
}

