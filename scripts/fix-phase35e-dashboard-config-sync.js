const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const filePath = path.join(
  ROOT,
  "src",
  "lib",
  "dashboard",
  "roleDashboard.ts"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ Fichier introuvable :", filePath);
  process.exit(1);
}

let source = fs.readFileSync(filePath, "utf8");
const backupPath =
  `${filePath}.phase35e-sync-config.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log(
    "✅ Backup créé :",
    path.relative(ROOT, backupPath)
  );
}

/*
 * Retirer l'ancien alias asynchrone ajouté par le hotfix précédent.
 * Il retournait Promise<getRoleDashboardData()> alors que la route API
 * historique utilise config.role, config.title, etc. sans await.
 */
source = source.replace(
  /\/\*\*[\s\S]*?Compatibilité Phase 35E[\s\S]*?export async function getRoleDashboardConfig\s*\([\s\S]*?\n\}\s*$/m,
  ""
);

source = source.replace(
  /export async function getRoleDashboardConfig\s*\([\s\S]*?\n\}\s*$/m,
  ""
);

source = source.replace(
  /export const getRoleDashboardConfig\s*=\s*async[\s\S]*?;\s*$/m,
  ""
);

const syncAdapter = `

export type LegacyRoleDashboardConfig = {
  role: string;
  title: string;
  subtitle: string;
  focus: string;
  metrics: string[];
  widgets: string[];
  quickActions: string[];
  sections: string[];
  [key: string]: unknown;
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

/**
 * Adaptateur synchrone pour l'ancienne route
 * src/app/api/dashboard/role/route.ts.
 *
 * Cette route lit directement config.role, config.title,
 * config.subtitle et config.focus. La fonction ne doit donc pas
 * retourner une Promise.
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
    Omit<LegacyRoleDashboardConfig, "role">
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
      quickActions: [
        "/souls",
        "/public-requests",
        "/events",
      ],
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

  const config =
    defaults[role] ||
    defaults.readonly;

  return {
    role,
    ...config,
  };
}
`;

source = source.trimEnd() + syncAdapter + "\n";
fs.writeFileSync(filePath, source, "utf8");

console.log(
  "✅ getRoleDashboardConfig remplacé par un adaptateur synchrone."
);
