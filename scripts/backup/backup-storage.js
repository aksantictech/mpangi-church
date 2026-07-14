const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { loadEnv, requireEnv } = require("./env-loader");

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : fallback;
}

function ensure(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function safe(value) {
  return String(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\.\./g, "_");
}

async function listAll(supabase, bucketId, prefix = "") {
  const all = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucketId)
      .list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      throw new Error(`${bucketId}/${prefix}: ${error.message}`);
    }

    const items = data || [];
    all.push(...items);
    if (items.length < 1000) break;
    offset += 1000;
  }

  return all;
}

function isFolder(item) {
  return !item.id || item.metadata == null;
}

async function collect(supabase, bucketId, prefix = "") {
  const entries = await listAll(supabase, bucketId, prefix);
  const objects = [];

  for (const entry of entries) {
    const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (isFolder(entry)) {
      objects.push(...(await collect(supabase, bucketId, objectPath)));
    } else {
      objects.push({
        path: objectPath,
        metadata: entry.metadata || {},
        createdAt: entry.created_at || null,
        updatedAt: entry.updated_at || null,
      });
    }
  }

  return objects;
}

async function main() {
  const root = process.cwd();
  const env = loadEnv(root);
  requireEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const output = path.resolve(root, arg("--output", "backups/storage-latest"));
  ensure(output);

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: env.NEXT_PUBLIC_SUPABASE_URL,
    buckets: [],
    errors: [],
  };

  for (const bucket of buckets || []) {
    console.log(`▶ Bucket ${bucket.id}`);
    const objects = await collect(supabase, bucket.id);
    const downloaded = [];

    for (const object of objects) {
      try {
        const { data, error: downloadError } = await supabase.storage
          .from(bucket.id)
          .download(object.path);

        if (downloadError || !data) {
          throw new Error(downloadError?.message || "Fichier vide");
        }

        const destination = path.join(
          output,
          safe(bucket.id),
          ...object.path.split("/").map(safe)
        );

        ensure(path.dirname(destination));
        const buffer = Buffer.from(await data.arrayBuffer());
        fs.writeFileSync(destination, buffer);

        downloaded.push({
          ...object,
          localPath: path.relative(output, destination).replace(/\\/g, "/"),
          size: buffer.length,
        });

        console.log(`  ✅ ${object.path}`);
      } catch (downloadError) {
        const message = downloadError?.message || String(downloadError);
        manifest.errors.push({
          bucketId: bucket.id,
          objectPath: object.path,
          message,
        });
        console.error(`  ❌ ${object.path}: ${message}`);
      }
    }

    manifest.buckets.push({
      id: bucket.id,
      name: bucket.name,
      public: Boolean(bucket.public),
      fileSizeLimit: bucket.file_size_limit || null,
      allowedMimeTypes: bucket.allowed_mime_types || null,
      expected: objects.length,
      downloaded: downloaded.length,
      objects: downloaded,
    });
  }

  fs.writeFileSync(
    path.join(output, "storage-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log(`Buckets : ${manifest.buckets.length}`);
  console.log(`Erreurs : ${manifest.errors.length}`);

  if (manifest.errors.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error("❌ Sauvegarde Storage échouée :", error.message || error);
  process.exit(1);
});
