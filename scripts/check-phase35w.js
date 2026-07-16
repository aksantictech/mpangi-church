const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checks = [
  {
    file:
      "src/components/public/NotificationSubscribeButton.tsx",
    markers: [
      "Samsung Internet",
      "Revérifier l’autorisation",
      "Permissions du site",
    ],
  },
  {
    file:
      "src/components/notifications/NotificationPermissionCard.tsx",
    markers: [
      "getBrowserLabel",
      "Autorisation bloquée dans",
    ],
  },
  {
    file:
      "src/components/public/PublicFeaturedUpdates.tsx",
    markers: [
      "Actualités et événements",
      "church_publications",
      "church_events",
    ],
  },
  {
    file:
      "src/app/church/[slug]/page.tsx",
    markers: [
      "PublicFeaturedUpdates",
      'dynamic = "force-dynamic"',
    ],
  },
  {
    file:
      "src/app/church/[slug]/teachings/layout.tsx",
    markers: [
      "PublicChurchBackLink",
      "PublicMobileBottomNav",
    ],
  },
  {
    file:
      "src/components/publications/PublicationForm.tsx",
    markers: [
      'value="event"',
      'value="news"',
    ],
  },
  {
    file:
      "src/app/api/publications/route.ts",
    markers: [
      '"event"',
      '"news"',
      "sendChurchNotification",
    ],
  },
];

let failed = false;

for (
  const check of checks
) {
  const fullPath =
    path.join(
      ROOT,
      check.file
    );

  if (
    !fs.existsSync(fullPath)
  ) {
    console.log(
      "❌",
      check.file
    );

    failed = true;
    continue;
  }

  const source =
    fs.readFileSync(
      fullPath,
      "utf8"
    );

  const missing =
    check.markers.filter(
      (marker) =>
        !source.includes(marker)
    );

  if (
    missing.length === 0
  ) {
    console.log(
      "✅",
      check.file
    );
  } else {
    console.log(
      "❌",
      check.file,
      "marqueurs absents :",
      missing.join(", ")
    );

    failed = true;
  }
}

if (
  !fs.existsSync(
    path.join(
      ROOT,
      "phase35w_public_experience.sql"
    )
  )
) {
  console.log(
    "❌ phase35w_public_experience.sql"
  );

  failed = true;
} else {
  console.log(
    "✅ phase35w_public_experience.sql"
  );
}

if (failed) {
  console.log("");
  console.log(
    "Phase 35W incomplète."
  );

  process.exit(1);
}

console.log("");
console.log(
  "✅ Phase 35W structurellement validée."
);
