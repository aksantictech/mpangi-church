const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");
const publicPagePath = path.join(
  ROOT,
  "src",
  "app",
  "church",
  "[slug]",
  "page.tsx"
);

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;

  if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

if (!fs.existsSync(layoutPath)) {
  console.error("src/app/layout.tsx introuvable.");
  process.exit(1);
}

let layout = fs.readFileSync(layoutPath, "utf8");
const originalLayout = layout;

if (!layout.includes("@/styles/mobile-production-hardening.css")) {
  layout =
    'import "@/styles/mobile-production-hardening.css";\n' + layout;
}

if (!layout.includes("@/components/pwa/TenantPwaBootstrap")) {
  layout =
    'import TenantPwaBootstrap from "@/components/pwa/TenantPwaBootstrap";\n' +
    layout;
}

if (!layout.includes("<TenantPwaBootstrap />")) {
  const bodyRegex = /<body([^>]*)>/;

  if (!bodyRegex.test(layout)) {
    console.error("Balise <body> non trouvée dans layout.tsx.");
    process.exit(1);
  }

  layout = layout.replace(
    bodyRegex,
    "<body$1>\n        <TenantPwaBootstrap />"
  );
}

if (layout !== originalLayout) {
  backup(layoutPath, "phase35a-final");
  fs.writeFileSync(layoutPath, layout, "utf8");
  console.log("✅ layout.tsx configuré.");
} else {
  console.log("ℹ️ layout.tsx déjà configuré.");
}

if (fs.existsSync(publicPagePath)) {
  let page = fs.readFileSync(publicPagePath, "utf8");
  const originalPage = page;

  page = page.replace(
    /import\s+PublicMobileActionBar\s+from\s+["'][^"']+["'];?\s*/g,
    ""
  );

  page = page.replace(
    /\s*<PublicMobileActionBar[\s\S]*?\/>\s*/g,
    "\n"
  );

  page = page.replace(
    /<PublicMobileBottomNav\s+slug=\{church\.slug\}\s*\/>/g,
    "<PublicMobileBottomNav slug={churchSlug} />"
  );

  const navCount = (page.match(/<PublicMobileBottomNav\b/g) || []).length;

  if (navCount > 1) {
    let kept = false;

    page = page.replace(
      /<PublicMobileBottomNav\s+slug=\{[^}]+\}\s*\/>/g,
      () => {
        if (!kept) {
          kept = true;
          return "<PublicMobileBottomNav slug={churchSlug} />";
        }

        return "";
      }
    );
  }

  if (page !== originalPage) {
    backup(publicPagePath, "phase35a-final");
    fs.writeFileSync(publicPagePath, page, "utf8");
    console.log("✅ page publique /church/[slug] nettoyée.");
  } else {
    console.log("ℹ️ page publique déjà propre.");
  }
}

console.log("");
console.log("Phase 35A installée.");
