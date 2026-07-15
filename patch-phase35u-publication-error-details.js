const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const filePath = path.join(
  ROOT,
  "src/app/api/publications/route.ts"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ Route publications introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(filePath, "utf8");
const backupPath = `${filePath}.phase35u-schema-hotfix.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
}

source = source.replace(
  `  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant la publication." },
      { status: 500 }
    );
  }
}`,
  `  } catch (caughtError: any) {
    console.error("Publication POST error:", caughtError);

    return NextResponse.json(
      {
        error:
          caughtError?.message ||
          "Erreur inattendue pendant la publication.",
        code: caughtError?.code || null,
        details: caughtError?.details || null,
        hint: caughtError?.hint || null,
      },
      { status: 500 }
    );
  }
}`
);

fs.writeFileSync(filePath, source, "utf8");

console.log("✅ Route publications : diagnostic détaillé activé.");
