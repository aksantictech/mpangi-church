const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const TEMPLATE_ROOT =
  path.join(
    ROOT,
    "templates"
  );

const BACKUP_ROOT =
  path.join(
    ROOT,
    ".phase35w2-backup"
  );

const DIRECT_FILES = [
  "src/components/public/PublicFeaturedUpdates.tsx",
  "src/components/public/PublicLiveStreamSection.tsx",
  "src/app/church/[slug]/live/page.tsx",
  "src/app/live/page.tsx",
];

function backupFile(
  relativePath
) {
  const targetPath =
    path.join(
      ROOT,
      relativePath
    );

  if (
    !fs.existsSync(
      targetPath
    )
  ) {
    return;
  }

  const backupPath =
    path.join(
      BACKUP_ROOT,
      relativePath
    );

  if (
    fs.existsSync(
      backupPath
    )
  ) {
    return;
  }

  fs.mkdirSync(
    path.dirname(
      backupPath
    ),
    {
      recursive: true,
    }
  );

  fs.copyFileSync(
    targetPath,
    backupPath
  );
}

function installDirectFile(
  relativePath
) {
  const templatePath =
    path.join(
      TEMPLATE_ROOT,
      `${relativePath}.txt`
    );

  const targetPath =
    path.join(
      ROOT,
      relativePath
    );

  if (
    !fs.existsSync(
      templatePath
    )
  ) {
    throw new Error(
      `Template manquant : ${relativePath}`
    );
  }

  backupFile(
    relativePath
  );

  fs.mkdirSync(
    path.dirname(
      targetPath
    ),
    {
      recursive: true,
    }
  );

  fs.copyFileSync(
    templatePath,
    targetPath
  );

  console.log(
    "✅",
    relativePath
  );
}

function patchFile(
  relativePath,
  patcher
) {
  const targetPath =
    path.join(
      ROOT,
      relativePath
    );

  if (
    !fs.existsSync(
      targetPath
    )
  ) {
    throw new Error(
      `Fichier introuvable : ${relativePath}`
    );
  }

  backupFile(
    relativePath
  );

  const source =
    fs.readFileSync(
      targetPath,
      "utf8"
    );

  const result =
    patcher(source);

  if (
    result === source
  ) {
    console.log(
      "ℹ️",
      relativePath,
      "déjà corrigé"
    );

    return;
  }

  fs.writeFileSync(
    targetPath,
    result,
    "utf8"
  );

  console.log(
    "✅",
    relativePath
  );
}

function patchPublicChurchPage(
  source
) {
  let next = source;

  const importMarker =
    'import PublicLiveStreamSection from "@/components/public/PublicLiveStreamSection";';

  if (
    !next.includes(
      "PublicFeaturedUpdates"
    )
  ) {
    if (
      !next.includes(
        importMarker
      )
    ) {
      throw new Error(
        "Import PublicLiveStreamSection introuvable."
      );
    }

    next = next.replace(
      importMarker,
      `${importMarker}\nimport PublicFeaturedUpdates from "@/components/public/PublicFeaturedUpdates";`
    );
  }

  if (
    !next.includes(
      'export const dynamic = "force-dynamic";'
    )
  ) {
    const typeMarker =
      "type PublicChurchPageProps = {";

    if (
      !next.includes(
        typeMarker
      )
    ) {
      throw new Error(
        "Type PublicChurchPageProps introuvable."
      );
    }

    next = next.replace(
      typeMarker,
      'export const dynamic = "force-dynamic";\nexport const revalidate = 0;\n\n' +
        typeMarker
    );
  }

  /*
   * Supprimer toute ancienne occurrence du bloc,
   * même si elle se trouve après le direct.
   */
  next = next.replace(
    /\s*<PublicFeaturedUpdates[\s\S]*?\/>\s*/g,
    "\n"
  );

  const liveMarkers = [
    '<PublicLiveStreamSection church={church as any} />',
    '<PublicLiveStreamSection church={church} />',
  ];

  const liveMarker =
    liveMarkers.find(
      (candidate) =>
        next.includes(
          candidate
        )
    );

  if (!liveMarker) {
    throw new Error(
      "Bloc PublicLiveStreamSection introuvable."
    );
  }

  next = next.replace(
    liveMarker,
    `<PublicFeaturedUpdates\n        churchId={church.id}\n        slug={churchSlug}\n      />\n\n      ${liveMarker}`
  );

  return next;
}

function patchSidebar(
  source
) {
  let next = source;

  if (
    !next.includes(
      "Radio,"
    )
  ) {
    next = next.replace(
      "  Search,\n  Shield,",
      "  Radio,\n  Search,\n  Shield,"
    );
  }

  if (
    !next.includes(
      "Culte en direct"
    )
  ) {
    const marker =
      `        {!collapsed && (\n          <Link\n            href="/mobile-menu"`;

    if (
      !next.includes(
        marker
      )
    ) {
      throw new Error(
        "Point d’insertion Sidebar introuvable."
      );
    }

    const liveLink =
      `        <Link\n          href="/live"\n          className={[\n            "mt-3 flex min-h-12 items-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700",\n            collapsed\n              ? "justify-center px-3"\n              : "gap-3 px-4",\n          ].join(" ")}\n          title="Culte en direct"\n        >\n          <Radio className="h-5 w-5 shrink-0 animate-pulse" />\n\n          {!collapsed && (\n            <span className="min-w-0">\n              <span className="block truncate text-sm font-black">\n                Culte en direct\n              </span>\n              <span className="block truncate text-[11px] font-semibold text-red-100">\n                Regarder dans l’application\n              </span>\n            </span>\n          )}\n        </Link>\n\n`;

    next = next.replace(
      marker,
      liveLink + marker
    );
  }

  return next;
}

function patchMobileTopBar(
  source
) {
  let next = source;

  if (
    !next.includes(
      "Radio,"
    )
  ) {
    next = next.replace(
      "  Menu,\n  Search,",
      "  Menu,\n  Radio,\n  Search,"
    );
  }

  if (
    !next.includes(
      'data-mpangi-live-link'
    )
  ) {
    const marker =
      `        </div>\n      </header>`;

    if (
      !next.includes(
        marker
      )
    ) {
      throw new Error(
        "Point d’insertion MobileTopBar introuvable."
      );
    }

    const liveLink =
      `        </div>\n\n        <Link\n          href="/live"\n          data-mpangi-live-link\n          className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-red-900/20"\n        >\n          <Radio className="h-4 w-4 animate-pulse" />\n          Culte en direct\n        </Link>\n      </header>`;

    next = next.replace(
      marker,
      liveLink
    );
  }

  return next;
}

function patchProxy(
  source
) {
  if (
    source.includes(
      '  "/live",'
    )
  ) {
    return source;
  }

  const marker =
    '  "/public-teachings",';

  if (
    !source.includes(
      marker
    )
  ) {
    throw new Error(
      "TENANT_PUBLIC_PATHS introuvable dans proxy.ts."
    );
  }

  return source.replace(
    marker,
    `${marker}\n  "/live",`
  );
}

for (
  const relativePath
  of DIRECT_FILES
) {
  installDirectFile(
    relativePath
  );
}

patchFile(
  "src/app/church/[slug]/page.tsx",
  patchPublicChurchPage
);

patchFile(
  "src/components/layout/Sidebar.tsx",
  patchSidebar
);

patchFile(
  "src/components/layout/MobileTopBar.tsx",
  patchMobileTopBar
);

patchFile(
  "src/proxy.ts",
  patchProxy
);

const gitignorePath =
  path.join(
    ROOT,
    ".gitignore"
  );

let gitignore =
  fs.existsSync(
    gitignorePath
  )
    ? fs.readFileSync(
        gitignorePath,
        "utf8"
      )
    : "";

for (const rule of [
  ".phase35w2-backup/",
  "templates/",
]) {
  if (
    !gitignore
      .split(/\r?\n/)
      .includes(rule)
  ) {
    gitignore +=
      `\n${rule}`;
  }
}

fs.writeFileSync(
  gitignorePath,
  `${gitignore.trim()}\n`,
  "utf8"
);

console.log("");
console.log(
  "✅ Phase 35W-2 installée."
);

console.log(
  "Exécutez maintenant le SQL, le checker et le build."
);
