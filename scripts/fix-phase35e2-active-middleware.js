const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.cwd();
const FORCE = process.argv.includes("--force");

const middlewareCandidates = [
  path.join(ROOT, "middleware.ts"),
  path.join(ROOT, "middleware.js"),
  path.join(ROOT, "middleware.mjs"),
  path.join(ROOT, "src", "middleware.ts"),
  path.join(ROOT, "src", "middleware.js"),
  path.join(ROOT, "src", "middleware.mjs"),
].filter((filePath) => fs.existsSync(filePath));

const proxyCandidates = [
  path.join(ROOT, "proxy.ts"),
  path.join(ROOT, "proxy.js"),
  path.join(ROOT, "proxy.mjs"),
  path.join(ROOT, "src", "proxy.ts"),
  path.join(ROOT, "src", "proxy.js"),
  path.join(ROOT, "src", "proxy.mjs"),
].filter((filePath) => fs.existsSync(filePath));

function normalizeSource(source) {
  return source
    .replace(/\r\n/g, "\n")
    .replace(
      /export\s+async\s+function\s+middleware\s*\(/g,
      "export async function proxy("
    )
    .replace(
      /export\s+function\s+middleware\s*\(/g,
      "export function proxy("
    )
    .replace(
      /export\s+const\s+middleware\s*=/g,
      "export const proxy ="
    )
    .replace(
      /function\s+middleware\s*\(/g,
      "function proxy("
    )
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, "")
    .trim();
}

function digest(source) {
  return crypto
    .createHash("sha256")
    .update(source)
    .digest("hex")
    .slice(0, 16);
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function archiveMiddleware(filePath, reason) {
  const backupPath = `${filePath}.phase35e2-active.bak`;
  const deprecatedPath = `${filePath}.deprecated`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  if (fs.existsSync(deprecatedPath)) {
    fs.rmSync(deprecatedPath);
  }

  fs.renameSync(filePath, deprecatedPath);

  console.log(
    `✅ Ancien middleware archivé : ${relative(deprecatedPath)} (${reason})`
  );
}

if (middlewareCandidates.length === 0) {
  console.log("ℹ️ Aucun middleware actif détecté.");

  if (proxyCandidates.length === 0) {
    console.error("❌ Aucun proxy Next.js détecté.");
    process.exit(1);
  }

  console.log(
    "✅ Proxy actif :",
    proxyCandidates.map(relative).join(", ")
  );
  process.exit(0);
}

if (proxyCandidates.length === 0) {
  console.error(
    "❌ Un middleware existe encore, mais aucun proxy n'a été créé."
  );
  process.exit(1);
}

if (proxyCandidates.length > 1) {
  console.error(
    "❌ Plusieurs fichiers proxy actifs sont présents :",
    proxyCandidates.map(relative).join(", ")
  );
  process.exit(1);
}

const proxyPath = proxyCandidates[0];
const proxySource = fs.readFileSync(proxyPath, "utf8");
const normalizedProxy = normalizeSource(proxySource);
const proxyStat = fs.statSync(proxyPath);

const conflicts = [];

for (const middlewarePath of middlewareCandidates) {
  const middlewareSource = fs.readFileSync(
    middlewarePath,
    "utf8"
  );
  const normalizedMiddleware = normalizeSource(
    middlewareSource
  );
  const middlewareStat = fs.statSync(middlewarePath);

  const sameLogic =
    normalizedMiddleware === normalizedProxy;

  const middlewareOlder =
    middlewareStat.mtimeMs <= proxyStat.mtimeMs;

  if (sameLogic) {
    archiveMiddleware(
      middlewarePath,
      "contenu équivalent au proxy"
    );
    continue;
  }

  if (middlewareOlder || FORCE) {
    archiveMiddleware(
      middlewarePath,
      FORCE
        ? "archivage forcé avec sauvegarde"
        : "fichier antérieur au proxy créé"
    );
    continue;
  }

  conflicts.push({
    middleware: relative(middlewarePath),
    middlewareHash: digest(normalizedMiddleware),
    middlewareModifiedAt:
      middlewareStat.mtime.toISOString(),
    proxy: relative(proxyPath),
    proxyHash: digest(normalizedProxy),
    proxyModifiedAt: proxyStat.mtime.toISOString(),
  });
}

if (conflicts.length > 0) {
  const reportPath = path.join(
    ROOT,
    "MIDDLEWARE_PROXY_CONFLICT.md"
  );

  const lines = [
    "# Conflit middleware / proxy",
    "",
    "Le script n'a pas archivé certains middlewares car leur contenu diffère du proxy et leur date est plus récente.",
    "",
    ...conflicts.flatMap((item) => [
      `## ${item.middleware}`,
      "",
      `- Hash middleware : ${item.middlewareHash}`,
      `- Modifié : ${item.middlewareModifiedAt}`,
      `- Proxy : ${item.proxy}`,
      `- Hash proxy : ${item.proxyHash}`,
      `- Modifié : ${item.proxyModifiedAt}`,
      "",
    ]),
    "Après vérification, l'archivage forcé peut être lancé avec :",
    "",
    "```powershell",
    "node scripts/fix-phase35e2-active-middleware.js --force",
    "```",
  ];

  fs.writeFileSync(
    reportPath,
    lines.join("\n"),
    "utf8"
  );

  console.error(
    "❌ Conflit détecté. Rapport : MIDDLEWARE_PROXY_CONFLICT.md"
  );
  process.exit(1);
}

console.log("");
console.log("✅ Nettoyage middleware terminé.");
console.log("✅ Proxy actif :", relative(proxyPath));
