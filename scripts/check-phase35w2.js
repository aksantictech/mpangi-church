const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checks = [
  {
    file:
      "src/components/public/PublicFeaturedUpdates.tsx",
    markers: [
      "category/type sont prioritaires",
      "Actualités et événements",
      "PUBLICATION_CATEGORIES",
      "Mis à jour automatiquement",
    ],
  },
  {
    file:
      "src/app/church/[slug]/page.tsx",
    markers: [
      "PublicFeaturedUpdates",
      "PublicLiveStreamSection",
      'dynamic = "force-dynamic"',
    ],
  },
  {
    file:
      "src/components/public/PublicLiveStreamSection.tsx",
    markers: [
      "Regarder dans l’application",
      'id="live"',
      "internalLiveHref",
    ],
  },
  {
    file:
      "src/app/church/[slug]/live/page.tsx",
    markers: [
      "Culte en direct",
      "getEmbedUrl",
      "PublicMobileBottomNav",
    ],
  },
  {
    file:
      "src/components/layout/Sidebar.tsx",
    markers: [
      "Culte en direct",
      'href="/live"',
      "bg-red-600",
    ],
  },
  {
    file:
      "src/components/layout/MobileTopBar.tsx",
    markers: [
      "data-mpangi-live-link",
      "Culte en direct",
    ],
  },
  {
    file:
      "src/proxy.ts",
    markers: [
      '"/live"',
      "TENANT_PUBLIC_PATHS",
    ],
  },
];

let failed = false;

for (const check of checks) {
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

const publicPagePath =
  path.join(
    ROOT,
    "src/app/church/[slug]/page.tsx"
  );

if (
  fs.existsSync(
    publicPagePath
  )
) {
  const source =
    fs.readFileSync(
      publicPagePath,
      "utf8"
    );

  const updatesIndex =
    source.indexOf(
      "<PublicFeaturedUpdates"
    );

  const liveIndex =
    source.indexOf(
      "<PublicLiveStreamSection"
    );

  const correctOrder =
    updatesIndex >= 0 &&
    liveIndex >= 0 &&
    updatesIndex <
      liveIndex;

  console.log(
    correctOrder
      ? "✅"
      : "❌",
    "Bloc Actualités placé avant Culte en direct"
  );

  if (!correctOrder) {
    failed = true;
  }
}

if (
  !fs.existsSync(
    path.join(
      ROOT,
      "phase35w2_public_updates_live.sql"
    )
  )
) {
  console.log(
    "❌ phase35w2_public_updates_live.sql"
  );

  failed = true;
} else {
  console.log(
    "✅ phase35w2_public_updates_live.sql"
  );
}

if (failed) {
  console.log("");
  console.log(
    "Phase 35W-2 incomplète."
  );

  process.exit(1);
}

console.log("");
console.log(
  "✅ Phase 35W-2 structurellement validée."
);
