const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "phase35u_final_publications_notifications.sql",
  "src/app/api/publications/route.ts",
  "src/components/publications/PublicationForm.tsx",
  "src/app/publications/page.tsx",
  "src/components/public/PublicTeachingsSection.tsx",
  "src/components/layout/MobileBottomNav.tsx",
  "src/components/public/PublicMobileBottomNav.tsx",
  "src/components/bible/BibleReaderClient.tsx",
  "src/app/church/[slug]/notifications/page.tsx",
  "src/app/alerts/page.tsx",
  "src/app/api/notifications/subscribe/route.ts",
  "src/app/api/push/subscribe/route.ts",
  "src/app/settings/page.tsx",
  "src/styles/production-stabilization.css",
  "public/sw.js",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(
    ROOT,
    relativePath
  );

  if (fs.existsSync(fullPath)) {
    console.log(
      "✅",
      relativePath
    );
  } else {
    console.log(
      "❌",
      relativePath
    );

    failed = true;
  }
}

function checkMarker(
  relativePath,
  label,
  markers
) {
  const fullPath = path.join(
    ROOT,
    relativePath
  );

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const source =
    fs.readFileSync(
      fullPath,
      "utf8"
    );

  const missing =
    markers.filter(
      (marker) =>
        !source.includes(marker)
    );

  if (missing.length === 0) {
    console.log(
      "✅",
      label
    );
  } else {
    console.log(
      "❌",
      label,
      "— marqueurs absents :",
      missing.join(", ")
    );

    failed = true;
  }
}

checkMarker(
  "src/app/api/publications/route.ts",
  "Publications alignées au schéma canonique",
  [
    'excerpt:',
    'category:',
    'status: published',
    'image_path:',
    'sendChurchNotification',
  ]
);

checkMarker(
  "src/components/publications/PublicationForm.tsx",
  "Photo et notification dans le formulaire",
  [
    'name="coverImage"',
    'value="event"',
    'name="notify"',
  ]
);

checkMarker(
  "src/components/layout/MobileBottomNav.tsx",
  "Menu mobile horizontal",
  [
    'role="navigation"',
    "gridTemplateColumns",
    'href: "/notifications"',
  ]
);

checkMarker(
  "src/components/bible/BibleReaderClient.tsx",
  "Lecteur Bible dynamique",
  [
    "/api/bible/versions",
    "/api/bible/books",
    "/api/bible/chapter",
    "/api/bible/search",
  ]
);

checkMarker(
  "src/app/settings/page.tsx",
  "Configuration des dons visible",
  [
    'href: "/settings/donations"',
    "Configuration des dons",
  ]
);

checkMarker(
  "public/sw.js",
  "Cache PWA renouvelé",
  [
    "mpangi-church-pwa-v5",
    "networkFirst",
  ]
);

if (failed) {
  console.log("");
  console.log(
    "Phase 35U finale incomplète."
  );

  process.exit(1);
}

console.log("");
console.log(
  "✅ Phase 35U finale structurellement validée."
);
