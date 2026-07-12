const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const target = path.join(ROOT, "src", "app", "super-admin", "profile", "password", "page.tsx");

if (!fs.existsSync(target)) {
  console.error("Fichier introuvable :", target);
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");
const original = source;

source = source.replace(
  'import { createSupabaseClient } from "@/lib/supabase/client";',
  'import { createClient } from "@/lib/supabase/client";'
);

source = source.replace(
  "const supabase = createSupabaseClient();",
  "const supabase = createClient();"
);

if (source !== original) {
  const backup = `${target}.supabase-client.bak`;
  if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
  fs.writeFileSync(target, source, "utf8");
  console.log("Correction appliquée :", path.relative(ROOT, target));
} else {
  console.log("Aucune correction nécessaire ou déjà corrigé.");
}
