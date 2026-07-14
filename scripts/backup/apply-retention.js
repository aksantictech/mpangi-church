const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./env-loader");

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function weekKey(date) {
  const copy = new Date(date);
  const day = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - day);
  return copy.toISOString().slice(0, 10);
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function selectUnique(entries, keyFn, count) {
  const seen = new Set();
  const selected = [];

  for (const entry of entries) {
    const key = keyFn(entry.date);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(entry);
    if (selected.length >= count) break;
  }

  return selected;
}

function main() {
  const root = process.cwd();
  const env = loadEnv(root);
  const backupsDir = path.resolve(root, arg("--backups-dir", "backups/mpangi-church"));
  const keepDaily = Number(arg("--daily", env.BACKUP_KEEP_DAILY || "7"));
  const keepWeekly = Number(arg("--weekly", env.BACKUP_KEEP_WEEKLY || "4"));
  const keepMonthly = Number(arg("--monthly", env.BACKUP_KEEP_MONTHLY || "6"));
  const execute = process.argv.includes("--execute");

  if (!fs.existsSync(backupsDir)) {
    console.log("ℹ️ Aucun dossier de sauvegarde.");
    return;
  }

  const entries = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(entry.name)
    )
    .map((entry) => {
      const parts = entry.name.match(
        /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/
      );

      const date = new Date(
        Date.UTC(
          Number(parts[1]),
          Number(parts[2]) - 1,
          Number(parts[3]),
          Number(parts[4]),
          Number(parts[5]),
          Number(parts[6])
        )
      );

      return {
        name: entry.name,
        directory: path.join(backupsDir, entry.name),
        archive: path.join(backupsDir, `${entry.name}.zip`),
        date,
      };
    })
    .sort((a, b) => b.date - a.date);

  const keep = new Set([
    ...selectUnique(entries, dayKey, keepDaily),
    ...selectUnique(entries, weekKey, keepWeekly),
    ...selectUnique(entries, monthKey, keepMonthly),
  ].map((entry) => entry.directory));

  const removable = entries.filter((entry) => !keep.has(entry.directory));

  console.log(
    `Politique : ${keepDaily} quotidiennes, ${keepWeekly} hebdomadaires, ${keepMonthly} mensuelles`
  );
  console.log(`Sauvegardes trouvées : ${entries.length}`);
  console.log(`À conserver : ${keep.size}`);
  console.log(`À supprimer : ${removable.length}`);

  for (const entry of removable) {
    console.log(execute ? "🗑️" : "DRY-RUN", entry.directory);

    if (execute) {
      fs.rmSync(entry.directory, { recursive: true, force: true });
      if (fs.existsSync(entry.archive)) fs.rmSync(entry.archive, { force: true });
    }
  }

  if (!execute && removable.length) {
    console.log("Aucune suppression effectuée. Ajouter --execute pour appliquer.");
  }
}

try {
  main();
} catch (error) {
  console.error("❌", error.message || error);
  process.exit(1);
}
