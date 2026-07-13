const { execSync } = require("child_process");

function run(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    return error.stdout || error.stderr || "";
  }
}

console.log("");
console.log("Ports Next.js locaux");
console.log("");

if (process.platform === "win32") {
  const output = run(
    'powershell -Command "Get-NetTCPConnection -LocalPort 3000,3001,3002 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess,State | Format-Table -AutoSize"'
  );

  console.log(output || "Aucun port 3000/3001/3002 détecté.");
} else {
  const output = run("lsof -i :3000 -i :3001 -i :3002 || true");
  console.log(output || "Aucun port 3000/3001/3002 détecté.");
}

console.log("");
console.log("Règle : après reset, ouvre uniquement http://localhost:3000");
