const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checks = [
  {
    file: "src/app/extensions/layout.tsx",
    markers: [
      "requireAnyModulePermission",
      '"extensions"',
    ],
  },
  {
    file: "src/app/api/finance/reports/export/route.ts",
    markers: ["requireAnyModulePermission"],
  },
  {
    file: "src/app/api/members/actions/route.ts",
    markers: [
      "requireAnyActionPermission",
      "requireAnyModulePermission",
    ],
  },
  {
    file: "src/app/api/settings/users/new/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/finance/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/finance/budgets/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/finance/donations/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/patrimony/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/settings/users/new/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/administration/correspondence/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/administration/minutes/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/administration/tasks/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/administration/transmissions/actions.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/api/attendance/event-presence/route.ts",
    markers: [
      "requireAnyActionPermission",
      "requireAnyModulePermission",
    ],
  },
  {
    file: "src/app/api/attendance/export/route.ts",
    markers: ["requireAnyModulePermission"],
  },
  {
    file: "src/app/api/attendance/scan/route.ts",
    markers: ["requireAnyActionPermission"],
  },
  {
    file: "src/app/api/souls/[id]/convert-to-member/route.ts",
    markers: ["requireAnyActionPermission"],
  },
];

let failed = false;

for (const check of checks) {
  const fullPath = path.join(
    ROOT,
    check.file
  );

  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.log("❌ Introuvable :", check.file);
    continue;
  }

  const source = fs.readFileSync(
    fullPath,
    "utf8"
  );

  const ok = check.markers.some((marker) =>
    source.includes(marker)
  );

  console.log(
    ok ? "✅" : "❌",
    check.file
  );

  if (!ok) failed = true;
}

if (failed) {
  console.log("");
  console.log(
    "Phase 35E-2B prioritaire incomplète."
  );
  process.exit(1);
}

console.log("");
console.log(
  "✅ Phase 35E-2B prioritaire validée."
);
