const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const logoPath = path.join(ROOT, "public", "images", "mpangi-logo.png");
const fallbackPath = path.join(ROOT, "public", "icons", "icon-192.png");

console.log("");
console.log("Vérification logos publics");
console.log("");

if (fs.existsSync(logoPath)) {
  const stat = fs.statSync(logoPath);
  console.log(`✅ public/images/mpangi-logo.png trouvé (${Math.round(stat.size / 1024)} KB)`);
} else {
  console.log("❌ public/images/mpangi-logo.png introuvable");
  console.log("   Mets le fichier dans public/images/mpangi-logo.png");
}

if (fs.existsSync(fallbackPath)) {
  console.log("✅ public/icons/icon-192.png trouvé comme fallback");
} else {
  console.log("⚠️ public/icons/icon-192.png introuvable");
}

console.log("");
console.log("URLs à tester :");
console.log("- http://localhost:3000/images/mpangi-logo.png?v=20260713");
console.log("- http://localhost:3000/icons/icon-192.png?v=20260713");
