const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const helperPath = path.join(
  ROOT,
  "src",
  "lib",
  "dashboard",
  "roleDashboard.ts"
);

const routePath = path.join(
  ROOT,
  "src",
  "app",
  "api",
  "dashboard",
  "role",
  "route.ts"
);

if (!fs.existsSync(helperPath)) {
  console.error("❌ Fichier introuvable :", helperPath);
  process.exit(1);
}

let source = fs.readFileSync(helperPath, "utf8");

const backupPath =
  `${helperPath}.phase35e-dashboard-contract-final.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(helperPath, backupPath);
  console.log(
    "✅ Backup créé :",
    path.relative(ROOT, backupPath)
  );
}

/*
 * Tous les correctifs précédents avaient ajouté le bloc de compatibilité
 * LegacyRoleDashboardConfig à la fin du fichier. On le remplace entièrement
 * afin d'éviter les types partiels, les Promises et les propriétés manquantes.
 */
const compatibilityStart =
  source.indexOf("export type LegacyRoleDashboardConfig");

if (compatibilityStart >= 0) {
  source = source.slice(0, compatibilityStart).trimEnd();
}

const compatibilityBlock = `

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

export type LegacyRoleDashboardConfig = {
  role: string;
  title: string;
  subtitle: string;
  focus: string;
  cards: LegacyRoleDashboardCard[];
  metrics: string[];
  widgets: string[];
  quickActions: any[];
  sections: any[];
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
      .replace(/[\\\\s-]+/g, "_");
  }

  return String(roleInput || "readonly")
    .trim()
    .toLowerCase()
    .replace(/[\\\\s-]+/g, "_");
}

function humanizeLegacyCode(code: string) {
  const labels: Record<string, string> = {
    churches: "Églises",
    users: "Utilisateurs",
    security: "Sécurité",
    activity: "Activité",
    members: "Membres",
    attendance: "Présences",
    public_requests: "Demandes publiques",
    tasks: "Tâches",
    souls: "Suivi des âmes",
    offerings: "Offrandes",
    expenses: "Dépenses",
    donations: "Dons",
    events: "Événements",
    assets: "Biens",
    maintenance: "Maintenance",
    movements: "Mouvements",
    correspondence: "Courriers",
    transmissions: "Transmissions",
    minutes: "Procès-verbaux",
  };

  return (
    labels[code] ||
    code
      .split("_")
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(" ")
  );
}

function legacyHrefForCode(code: string) {
  const hrefs: Record<string, string> = {
    churches: "/super-admin/churches",
    users: "/settings/users",
    security: "/settings/roles",
    members: "/members",
    attendance: "/attendance",
    public_requests: "/public-requests",
    tasks: "/my-work",
    souls: "/souls",
    offerings: "/finance/offerings",
    expenses: "/finance/expenses",
    donations: "/finance/donations",
    events: "/events",
    assets: "/patrimony/assets",
    maintenance: "/patrimony/maintenance",
    movements: "/patrimony/movements",
    correspondence: "/administration/correspondence",
    transmissions: "/administration/transmissions",
    minutes: "/administration/minutes",
  };

  return hrefs[code] || "/dashboard/role";
}

function createLegacyCards(
  metrics: string[]
): LegacyRoleDashboardCard[] {
  return metrics.map((code) => ({
    code,
    title: humanizeLegacyCode(code),
    description: \`Indicateur \${humanizeLegacyCode(code).toLowerCase()}.\`,
    href: legacyHrefForCode(code),
    metricKey: code,
    moduleCode: code,
    tone: "blue",
  }));
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
    pastor: "pastor",
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

  const defaults: Record<
    string,
    Omit<LegacyRoleDashboardConfig, "role" | "cards">
  > = {
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
        "public_requests",
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
      title: "Gestion du département",
      subtitle:
        "Suivez les membres, présences et activités du département.",
      focus: "Coordination du département",
      metrics: ["members", "attendance", "events", "tasks"],
      widgets: [
        "departments",
        "members",
        "attendance",
        "tasks",
      ],
      quickActions: [
        "/departments",
        "/attendance",
        "/my-work",
      ],
      sections: ["department", "members", "activities"],
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

  const config = defaults[role] || defaults.readonly;
  const metrics = Array.isArray(config.metrics)
    ? config.metrics
    : [];

  return {
    role,
    ...config,
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
`;

source = source + compatibilityBlock + "\n";

fs.writeFileSync(helperPath, source, "utf8");

console.log(
  "✅ Contrat dashboard définitif installé dans roleDashboard.ts."
);

/*
 * Protection supplémentaire dans la route historique :
 * même si une future configuration personnalisée omet cards,
 * la route ne doit jamais planter sur .map().
 */
if (fs.existsSync(routePath)) {
  let routeSource = fs.readFileSync(routePath, "utf8");
  const routeBackup =
    `${routePath}.phase35e-dashboard-contract-final.bak`;

  if (!fs.existsSync(routeBackup)) {
    fs.copyFileSync(routePath, routeBackup);
    console.log(
      "✅ Backup créé :",
      path.relative(ROOT, routeBackup)
    );
  }

  routeSource = routeSource.replace(
    /cards:\s*config\.cards\.map\s*\(/g,
    "cards: (Array.isArray(config.cards) ? config.cards : []).map("
  );

  fs.writeFileSync(routePath, routeSource, "utf8");

  console.log(
    "✅ Protection config.cards ajoutée dans la route API."
  );
} else {
  console.log(
    "⚠️ Route API dashboard introuvable ; helper corrigé uniquement."
  );
}
