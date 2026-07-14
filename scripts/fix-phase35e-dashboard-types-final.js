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

if (!fs.existsSync(helperPath)) {
  console.error("❌ Fichier introuvable :", helperPath);
  process.exit(1);
}

let source = fs.readFileSync(helperPath, "utf8");

const backupPath =
  `${helperPath}.phase35e-dashboard-types-final.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(helperPath, backupPath);

  console.log(
    "✅ Backup créé :",
    path.relative(ROOT, backupPath)
  );
}

/*
 * CAUSE DU BUG
 * -------------
 * LegacyRoleDashboardConfig possède une signature :
 *
 *   [key: string]: any
 *
 * Utiliser ensuite :
 *
 *   Omit<LegacyRoleDashboardConfig, "role" | "cards">
 *
 * fait perdre à TypeScript la connaissance explicite de title,
 * subtitle et focus. Le spread ...config ne garantit donc plus
 * ces propriétés dans la valeur retournée.
 *
 * CORRECTION
 * ----------
 * - créer un type de base sans signature dynamique ;
 * - typer defaults avec ce type ;
 * - retourner explicitement toutes les propriétés obligatoires.
 */

const oldConfigTypeRegex =
  /export type LegacyRoleDashboardConfig = \{[\s\S]*?\n\};\n\nfunction readLegacyRoleCode/;

const newConfigTypes = `export type LegacyRoleDashboardBaseConfig = {
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

function readLegacyRoleCode`;

if (!oldConfigTypeRegex.test(source)) {
  console.error(
    "❌ Bloc LegacyRoleDashboardConfig non reconnu."
  );
  process.exit(1);
}

source = source.replace(
  oldConfigTypeRegex,
  newConfigTypes
);

source = source.replace(
  /const defaults:\s*Record<\s*string,\s*Omit<LegacyRoleDashboardConfig,\s*"role"\s*\|\s*"cards">\s*>\s*=/m,
  "const defaults: Record<string, LegacyRoleDashboardBaseConfig> ="
);

source = source.replace(
  /const config = defaults\[role\] \|\| defaults\.readonly;/,
  `const config: LegacyRoleDashboardBaseConfig =
    defaults[role] ?? defaults.readonly;`
);

const returnBlockRegex =
  /return \{\s*role,\s*\.\.\.config,\s*metrics,\s*widgets:\s*Array\.isArray\(config\.widgets\)[\s\S]*?cards:\s*createLegacyCards\(metrics\),\s*\};/m;

const finalReturnBlock = `return {
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
  };`;

if (!returnBlockRegex.test(source)) {
  console.error(
    "❌ Bloc return du dashboard non reconnu."
  );
  process.exit(1);
}

source = source.replace(
  returnBlockRegex,
  finalReturnBlock
);

fs.writeFileSync(helperPath, source, "utf8");

console.log(
  "✅ Types LegacyRoleDashboardConfig corrigés."
);
console.log(
  "✅ title, subtitle et focus retournés explicitement."
);
console.log(
  "✅ Omit problématique supprimé."
);
