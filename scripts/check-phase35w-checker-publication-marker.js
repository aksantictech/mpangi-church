const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checkerPath = path.join(
  ROOT,
  "scripts/check-phase35w.js"
);

const routePath = path.join(
  ROOT,
  "src/app/api/publications/route.ts"
);

let failed = false;

if (!fs.existsSync(checkerPath)) {
  console.log("❌ scripts/check-phase35w.js");
  failed = true;
} else {
  const source = fs.readFileSync(
    checkerPath,
    "utf8"
  );

  const ok = source.includes(
    '"sendChurchNotification"'
  );

  console.log(
    ok ? "✅" : "❌",
    "Checker publication Phase 35W"
  );

  if (!ok) failed = true;
}

if (!fs.existsSync(routePath)) {
  console.log(
    "❌ src/app/api/publications/route.ts"
  );
  failed = true;
} else {
  const source = fs.readFileSync(
    routePath,
    "utf8"
  );

  const checks = [
    source.includes("sendChurchNotification"),
    source.includes('"event"'),
    source.includes('"news"'),
  ];

  const ok = checks.every(Boolean);

  console.log(
    ok ? "✅" : "❌",
    "Route Publications compatible Phase 35W"
  );

  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log(
  "✅ Hotfix checker Publications validé."
);
