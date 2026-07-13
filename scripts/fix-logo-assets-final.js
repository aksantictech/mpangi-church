const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const publicDir = path.join(ROOT, "public");
const imagesDir = path.join(publicDir, "images");
const iconsDir = path.join(publicDir, "icons");

fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(iconsDir, { recursive: true });

function findLogoCandidate() {
  const candidates = [];

  const dirs = [
    imagesDir,
    path.join(publicDir, "icones"),
    iconsDir,
    publicDir,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    for (const name of fs.readdirSync(dir)) {
      const lower = name.toLowerCase();

      if (
        lower.includes("mpangi") &&
        lower.includes("logo") &&
        [".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(lower))
      ) {
        candidates.push(path.join(dir, name));
      }
    }
  }

  return candidates[0] || null;
}

const exactLogoPath = path.join(imagesDir, "mpangi-logo.png");
let sourceLogo = fs.existsSync(exactLogoPath) ? exactLogoPath : findLogoCandidate();

if (sourceLogo && sourceLogo !== exactLogoPath) {
  fs.copyFileSync(sourceLogo, exactLogoPath);
  console.log("Logo copié vers public/images/mpangi-logo.png depuis :", path.relative(ROOT, sourceLogo));
}

if (!fs.existsSync(exactLogoPath)) {
  const svgPath = path.join(imagesDir, "mpangi-logo-fallback.svg");

  fs.writeFileSync(
    svgPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
      <rect width="192" height="192" rx="42" fill="#03357A"/>
      <text x="96" y="88" text-anchor="middle" font-size="28" font-family="Arial" font-weight="700" fill="white">MPANGI</text>
      <text x="96" y="122" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="#EAF3FA">CHURCH</text>
    </svg>`,
    "utf8"
  );

  console.log("Aucun PNG trouvé. Fallback SVG créé :", path.relative(ROOT, svgPath));
} else {
  for (const targetName of ["icon-192.png", "icon-512.png"]) {
    const target = path.join(iconsDir, targetName);
    fs.copyFileSync(exactLogoPath, target);
    console.log("Icône copiée :", path.relative(ROOT, target));
  }
}

console.log("");
console.log("URLs à tester :");
console.log("http://localhost:3000/images/mpangi-logo.png?v=final");
console.log("http://localhost:3000/icons/icon-192.png?v=final");
