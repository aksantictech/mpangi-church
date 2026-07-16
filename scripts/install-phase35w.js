const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const TEMPLATE_ROOT =
  path.join(ROOT, "templates");

const BACKUP_ROOT =
  path.join(
    ROOT,
    ".phase35w-backup"
  );

const DIRECT_FILES = [
  "src/components/public/NotificationSubscribeButton.tsx",
  "src/components/notifications/NotificationPermissionCard.tsx",
  "src/components/public/PublicFeaturedUpdates.tsx",
  "src/app/church/[slug]/teachings/layout.tsx",
];

function backupFile(
  relativePath
) {
  const targetPath =
    path.join(
      ROOT,
      relativePath
    );

  if (!fs.existsSync(targetPath)) {
    return;
  }

  const backupPath =
    path.join(
      BACKUP_ROOT,
      relativePath
    );

  if (fs.existsSync(backupPath)) {
    return;
  }

  fs.mkdirSync(
    path.dirname(backupPath),
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

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template manquant : ${relativePath}`
    );
  }

  backupFile(relativePath);

  fs.mkdirSync(
    path.dirname(targetPath),
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

  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `Fichier introuvable : ${relativePath}`
    );
  }

  backupFile(relativePath);

  const source =
    fs.readFileSync(
      targetPath,
      "utf8"
    );

  const result =
    patcher(source);

  if (
    !result ||
    result === source
  ) {
    console.log(
      "ℹ️",
      relativePath,
      "déjà corrigé ou aucun changement requis"
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

  if (
    !next.includes(
      'PublicFeaturedUpdates'
    )
  ) {
    const importMarker =
      'import PublicLiveStreamSection from "@/components/public/PublicLiveStreamSection";';

    if (
      !next.includes(
        importMarker
      )
    ) {
      throw new Error(
        "Import PublicLiveStreamSection introuvable dans la page publique."
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
      'type PublicChurchPageProps = {';

    if (
      !next.includes(
        typeMarker
      )
    ) {
      throw new Error(
        "Point d’insertion dynamique introuvable."
      );
    }

    next = next.replace(
      typeMarker,
      'export const dynamic = "force-dynamic";\nexport const revalidate = 0;\n\n' +
        typeMarker
    );
  }

  if (
    !next.includes(
      '<PublicFeaturedUpdates'
    )
  ) {
    const markers = [
      '<PublicLiveStreamSection church={church as any} />',
      '<PublicLiveStreamSection church={church} />',
    ];

    const marker =
      markers.find(
        (candidate) =>
          next.includes(candidate)
      );

    if (!marker) {
      throw new Error(
        "Bloc PublicLiveStreamSection introuvable."
      );
    }

    next = next.replace(
      marker,
      `${marker}\n      <PublicFeaturedUpdates\n        churchId={church.id}\n        slug={churchSlug}\n      />`
    );
  }

  return next;
}

function patchPublicationForm(
  source
) {
  let next = source;

  if (
    !next.includes(
      '<option value="event">Événement</option>'
    )
  ) {
    const marker =
      '<option value="announcement">Annonce</option>';

    if (
      !next.includes(marker)
    ) {
      throw new Error(
        "Option Annonce introuvable dans PublicationForm."
      );
    }

    next = next.replace(
      marker,
      `${marker}\n            <option value="event">Événement</option>\n            <option value="news">Actualité</option>`
    );
  }

  return next;
}

function patchPublicationRoute(
  source
) {
  let next = source;

  const exactList =
    '["teaching", "video", "message", "announcement", "sermon"]';

  if (next.includes(exactList)) {
    next = next.replace(
      exactList,
      '["teaching", "video", "message", "announcement", "sermon", "event", "news", "actuality"]'
    );
  }

  next = next.replaceAll(
    'title: `Nouvel enseignement : ${title}`',
    'title: `Nouvelle publication : ${title}`'
  );

  next = next.replaceAll(
    'title: `Nouvel enseignement : ${publication.title}`',
    'title: `Nouvelle publication : ${publication.title}`'
  );

  return next;
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
  "src/components/publications/PublicationForm.tsx",
  patchPublicationForm
);

patchFile(
  "src/app/api/publications/route.ts",
  patchPublicationRoute
);

const gitignorePath =
  path.join(
    ROOT,
    ".gitignore"
  );

let gitignore =
  fs.existsSync(gitignorePath)
    ? fs.readFileSync(
        gitignorePath,
        "utf8"
      )
    : "";

for (
  const rule of [
    ".phase35w-backup/",
    "templates/",
  ]
) {
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
  "✅ Phase 35W installée."
);
console.log(
  "Exécutez maintenant le SQL, le checker et le build."
);
