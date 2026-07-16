const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checks = [
  {
    file:
      "src/app/api/push/subscribe/route.ts",
    markers: [
      "church_notification_subscriptions",
      'export const runtime = "nodejs"',
    ],
  },
  {
    file:
      "src/lib/notifications/push.ts",
    markers: [
      "Aucun appareil n’est encore abonné",
      "variables VAPID absentes",
    ],
  },
  {
    file:
      "src/components/publications/PublicationForm.tsx",
    markers: [
      "notifyRequested",
      "Publication enregistrée",
      'action: "notify"',
    ],
  },
  {
    file:
      "src/app/teachings/actions.ts",
    markers: [
      "notifyTeachingSafely",
      "Impossible d’enregistrer l’enseignement",
    ],
  },
  {
    file:
      "src/app/finance/donations/page.tsx",
    markers: [
      "Retour aux finances",
      "Tableau de bord",
    ],
  },
  {
    file:
      "src/app/my-work/page.tsx",
    markers: [
      "Retour au dashboard",
      "Ouvrir les modules",
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
    !fs.existsSync(
      fullPath
    )
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
        !source.includes(
          marker
        )
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
      "phase35v_operational_reliability.sql"
    )
  )
) {
  console.log(
    "❌ phase35v_operational_reliability.sql"
  );

  failed = true;
} else {
  console.log(
    "✅ phase35v_operational_reliability.sql"
  );
}

if (failed) {
  console.log("");
  console.log(
    "Phase 35V incomplète."
  );

  process.exit(1);
}

console.log("");
console.log(
  "✅ Phase 35V structurellement validée."
);
