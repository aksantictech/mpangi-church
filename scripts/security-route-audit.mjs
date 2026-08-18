import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const report = {
  generatedAt: new Date().toISOString(),
  critical: [],
  warnings: [],
  passed: [],
  stats: {},
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function add(level, file, message) {
  report[level].push({ file: rel(file), message });
}

const sourceFiles = walk(SRC).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
const apiRoutes = sourceFiles.filter((file) => /src[\\/]app[\\/]api[\\/].*[\\/]route\.(ts|js)$/.test(file));

const guardPatterns = [
  /auth\.getUser\s*\(/,
  /requireActiveProfile\s*\(/,
  /requireChurchModuleAccess\s*\(/,
  /requireAuthenticatedAccess\s*\(/,
  /requireChurchAdmin\s*\(/,
  /requireSuperAdmin\s*\(/,
  /getSecurityContext\s*\(/,
  /getCurrentSecurityContext\s*\(/,
  /getAllowedNavigationItems\s*\(/,
  /getCurrentChurchRoleValidation\s*\(/,
];

const publicRoutePatterns = [
  /\/api\/public\//,
  /\/api\/auth\//,
  /\/api\/member-forms\//,
  /\/api\/push\/public-key/,

  // Explicitly public-by-design routes. They must expose only non-sensitive data.
  /\/api\/account\/branding$/,
  /\/api\/bible\/(books|chapter|passage|search|versions)$/,
  /\/api\/push\/subscribe$/,
  /\/api\/pwa\/icon(?:\/.*)?$/,
  /\/api\/pwa\/manifest$/,
  /\/api\/pwa\/tenant$/,
];

for (const file of apiRoutes) {
  const code = fs.readFileSync(file, "utf8");
  const route = `/${rel(file).replace(/^src\/app\//, "").replace(/\/route\.(ts|js)$/, "")}`;
  const isPublic = publicRoutePatterns.some((pattern) => pattern.test(route));
  const guarded = guardPatterns.some((pattern) => pattern.test(code));
  const usesAdmin = /createAdminClient\s*\(/.test(code);
  const hasTenantScope = /church_id/.test(code) || /churchId/.test(code) || /requireSuperAdmin/.test(code);

  if (!isPublic && !guarded) {
    add("critical", file, "Route API non publique sans garde d’authentification détectable.");
  } else {
    add("passed", file, isPublic ? "Route publique explicitement reconnue." : "Garde d’authentification détectée.");
  }

  if (usesAdmin && !isPublic && !hasTenantScope) {
    add("critical", file, "createAdminClient utilisé sans indice de filtrage church_id / contexte tenant.");
  }

function hasSensitiveNextResponseJson(source) {
  const marker = "NextResponse.json(";
  let searchFrom = 0;

  while (true) {
    const start = source.indexOf(marker, searchFrom);

    if (start === -1) {
      return false;
    }

    let index = start + marker.length;
    let depth = 1;
    let quote = null;
    let escaped = false;

    while (index < source.length && depth > 0) {
      const char = source[index];

      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }

        index += 1;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        quote = char;
        index += 1;
        continue;
      }

      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      }

      index += 1;
    }

    const responseCall = source.slice(
      start,
      index
    );

    const exposesSensitiveKey =
      /\b(password|access_token|refresh_token|service_role)\s*:/.test(
        responseCall
      );

    if (exposesSensitiveKey) {
      return true;
    }

    searchFrom = index;
  }
}

if (hasSensitiveNextResponseJson(code)) {
  add(
    "critical",
    file,
    "Réponse API exposant potentiellement un champ secret ou token."
  );
}
}

const secretPatterns = [
  { regex: /sk-[A-Za-z0-9_-]{20,}/g, label: "clé OpenAI en dur" },
  { regex: /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'`][^"'`]+/g, label: "clé service role en dur" },
  { regex: /VAPID_PRIVATE_KEY\s*[=:]\s*["'`][^"'`]+/g, label: "clé VAPID privée en dur" },
  { regex: /password\s*[=:]\s*["'`](?!password|secret|temporary|temp)[^"'`]{6,}["'`]/gi, label: "mot de passe potentiellement codé en dur" },
];

for (const file of sourceFiles) {
  const code = fs.readFileSync(file, "utf8");

  if (/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|PRIVATE|SERVICE_ROLE|PASSWORD)/.test(code)) {
    add("critical", file, "Variable sensible exposée via NEXT_PUBLIC_.");
  }

  for (const { regex, label } of secretPatterns) {
    regex.lastIndex = 0;
    if (regex.test(code)) add("critical", file, `${label} détecté(e).`);
  }

  if (/createAdminClient/.test(code) && /["']use client["']/.test(code)) {
    add("critical", file, "Client Supabase administrateur importé dans un composant client.");
  }
}

const passwordFiles = sourceFiles.filter((file) => /password/i.test(fs.readFileSync(file, "utf8")));
for (const file of passwordFiles) {
  const code = fs.readFileSync(file, "utf8");
  const weakCheck = code.match(/password\.length\s*<\s*(\d+)/i);
  if (weakCheck && Number(weakCheck[1]) < 15) {
    add(
      "warnings",
      file,
      `Politique de mot de passe détectée à ${weakCheck[1]} caractères minimum ; 15 caractères est la cible pour un mot de passe utilisé comme facteur unique.`
    );
  }
}

// Vérification simple des pages sensibles : les pages qui utilisent createAdminClient doivent
// soit appeler une garde serveur, soit contenir un filtrage church_id explicite.
const sensitivePageFiles = sourceFiles.filter((file) =>
  /src[\\/]app[\\/].*[\\/]page\.tsx$/.test(file) && /createAdminClient/.test(fs.readFileSync(file, "utf8"))
);
for (const file of sensitivePageFiles) {
  const code = fs.readFileSync(file, "utf8");
  const guarded = guardPatterns.some((pattern) => pattern.test(code)) || /auth\.getUser/.test(code);
  const scoped = /church_id/.test(code) || /churchId/.test(code);
  if (!guarded && !scoped) {
    add("warnings", file, "Page serveur utilisant createAdminClient sans garde/filtre tenant évident.");
  }
}

report.stats = {
  sourceFiles: sourceFiles.length,
  apiRoutes: apiRoutes.length,
  critical: report.critical.length,
  warnings: report.warnings.length,
  passedChecks: report.passed.length,
};

const target = path.join(ROOT, "security-audit-report.json");
fs.writeFileSync(target, JSON.stringify(report, null, 2));

console.log("\n=== MPANGI SECURITY ROUTE AUDIT ===");
console.log(`API routes analysées : ${report.stats.apiRoutes}`);
console.log(`Critiques : ${report.stats.critical}`);
console.log(`Avertissements : ${report.stats.warnings}`);
console.log(`Rapport : ${target}`);

for (const item of report.critical) {
  console.error(`CRITICAL ${item.file} — ${item.message}`);
}
for (const item of report.warnings.slice(0, 25)) {
  console.warn(`WARN ${item.file} — ${item.message}`);
}

process.exit(report.critical.length ? 2 : 0);
