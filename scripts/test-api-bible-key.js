const fs = require("fs");
const path = require("path");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");

    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    value = value.replace(/^["']|["']$/g, "");
    values[key] = value;
  }

  return values;
}

async function main() {
  const env = {
    ...readEnvFile(path.join(process.cwd(), ".env.local")),
    ...process.env,
  };

  const apiKey = String(env.BIBLE_API_KEY || "").trim();

  if (!apiKey) {
    console.error("❌ BIBLE_API_KEY absente de .env.local.");
    process.exit(1);
  }

  const response = await fetch(
    "https://rest.api.bible/v1/bibles?language=fra&include-full-details=true",
    {
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    console.error("❌ API.Bible :", response.status, payload);
    process.exit(1);
  }

  const versions = payload.data || [];

  console.log("");
  console.log(`✅ Clé API.Bible valide. ${versions.length} version(s) française(s) accessible(s).`);
  console.log("");

  for (const version of versions) {
    console.log(
      `- ${version.abbreviationLocal || version.abbreviation} | ${version.nameLocal || version.name} | ${version.id}`
    );
  }

  console.log("");
  console.log(
    "Copiez éventuellement les IDs voulus dans BIBLE_ALLOWED_VERSION_IDS."
  );
}

main().catch((error) => {
  console.error("❌", error.message);
  process.exit(1);
});
