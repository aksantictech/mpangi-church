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
    ".phase35v-backup"
  );

const FILES = [
  "src/app/api/push/subscribe/route.ts",
  "src/lib/notifications/push.ts",
  "src/components/public/NotificationSubscribeButton.tsx",
  "src/components/notifications/NotificationPermissionCard.tsx",
  "src/components/publications/PublicationForm.tsx",
  "src/app/api/publications/route.ts",
  "src/app/teachings/actions.ts",
  "src/app/teachings/new/page.tsx",
  "src/app/teachings/[id]/page.tsx",
  "src/app/finance/donations/page.tsx",
  "src/app/my-work/page.tsx",
];

function copyWithBackup(
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

  const backupPath =
    path.join(
      BACKUP_ROOT,
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

  if (
    fs.existsSync(
      targetPath
    ) &&
    !fs.existsSync(
      backupPath
    )
  ) {
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

try {
  for (
    const relativePath
    of FILES
  ) {
    copyWithBackup(
      relativePath
    );
  }

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

  for (
    const rule of [
      ".phase35v-backup/",
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
    "✅ Phase 35V installée."
  );

  console.log(
    "Exécutez maintenant le SQL puis le checker."
  );
} catch (error) {
  console.error(
    "❌",
    error.message || error
  );

  process.exit(1);
}
