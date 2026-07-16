const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checkerPath = path.join(
  ROOT,
  "scripts/check-phase35v.js"
);

const pushPath = path.join(
  ROOT,
  "src/lib/notifications/push.ts"
);

let failed = false;

if (!fs.existsSync(checkerPath)) {
  console.log("❌ scripts/check-phase35v.js");
  failed = true;
} else {
  const source = fs.readFileSync(checkerPath, "utf8");

  const ok = source.includes(
    '"variables VAPID absentes"'
  );

  console.log(
    ok ? "✅" : "❌",
    "Marqueur VAPID du checker"
  );

  if (!ok) failed = true;
}

if (!fs.existsSync(pushPath)) {
  console.log("❌ src/lib/notifications/push.ts");
  failed = true;
} else {
  const source = fs.readFileSync(pushPath, "utf8");

  const ok =
    source.includes("variables VAPID absentes") ||
    source.includes("Variables VAPID manquantes");

  console.log(
    ok ? "✅" : "❌",
    "Gestion VAPID présente dans push.ts"
  );

  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log("✅ Hotfix checker VAPID validé.");
