const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const activeMiddleware = [
  "middleware.ts",
  "middleware.js",
  "middleware.mjs",
  "src/middleware.ts",
  "src/middleware.js",
  "src/middleware.mjs",
].filter((relativePath) =>
  fs.existsSync(path.join(ROOT, relativePath))
);

const activeProxy = [
  "proxy.ts",
  "proxy.js",
  "proxy.mjs",
  "src/proxy.ts",
  "src/proxy.js",
  "src/proxy.mjs",
].filter((relativePath) =>
  fs.existsSync(path.join(ROOT, relativePath))
);

let failed = false;

if (activeMiddleware.length > 0) {
  failed = true;
  console.log(
    "❌ Middleware encore actif :",
    activeMiddleware.join(", ")
  );
} else {
  console.log("✅ Aucun middleware déprécié actif");
}

if (activeProxy.length === 1) {
  console.log("✅ Proxy Next.js actif :", activeProxy[0]);
} else if (activeProxy.length === 0) {
  failed = true;
  console.log("❌ Aucun proxy actif");
} else {
  failed = true;
  console.log(
    "❌ Plusieurs proxy actifs :",
    activeProxy.join(", ")
  );
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log(
  "✅ Migration middleware → proxy définitivement validée."
);
