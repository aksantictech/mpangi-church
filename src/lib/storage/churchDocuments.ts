export const CHURCH_DOCUMENTS_BUCKET = "church-documents";

export type UploadedChurchDocument = {
  path: string;
  url: string;
  publicUrl: string;
  document_path: string;
  document_url: string;
  filename: string;
  name: string;
  size: number;
  mime_type: string;
  mimeType: string;
  bucket: string;
};

type UploadChurchDocumentInput = {
  admin: any;
  churchId: string | null | undefined;
  module: string;
  file: FormDataEntryValue | null;
  bucket?: string;
};

type DownloadHrefInput =
  | string
  | {
      path?: string | null;
      documentPath?: string | null;
      document_path?: string | null;
      filename?: string | null;
      name?: string | null;
    }
  | null
  | undefined;

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function cleanSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getSafeFilename(filename: string) {
  const clean = cleanSegment(filename || "document");

  return clean || "document";
}

export async function uploadChurchDocument({
  admin,
  churchId,
  module,
  file,
  bucket = CHURCH_DOCUMENTS_BUCKET,
}: UploadChurchDocumentInput): Promise<UploadedChurchDocument | null> {
  if (!isFile(file) || file.size === 0) {
    return null;
  }

  if (!churchId) {
    throw new Error("churchId est obligatoire pour téléverser un document.");
  }

  const safeModule = cleanSegment(module || "general");
  const safeFilename = getSafeFilename(file.name);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${churchId}/${safeModule}/${unique}-${safeFilename}`;
  const mimeType = file.type || "application/octet-stream";

  const { error } = await admin.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: mimeType,
  });

  if (error) {
    throw new Error(error.message || "Téléversement du document impossible.");
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl || "";

  return {
    path,
    url: publicUrl,
    publicUrl,
    document_path: path,
    document_url: publicUrl,

    // Compatibilité avec les anciens modules
    filename: file.name,
    name: file.name,
    size: file.size,
    mime_type: mimeType,
    mimeType,

    bucket,
  };
}

export function getDocumentDownloadHref(input: DownloadHrefInput) {
  const path =
    typeof input === "string"
      ? input
      : input?.path || input?.documentPath || input?.document_path || "";

  const filename =
    typeof input === "string" ? "" : input?.filename || input?.name || "";

  if (!path) return "#";

  const query = new URLSearchParams({
    path,
  });

  if (filename) {
    query.set("filename", filename);
  }

  return `/api/documents/download?${query.toString()}`;
}

export function getChurchDocumentPublicUrl({
  admin,
  path,
  bucket = CHURCH_DOCUMENTS_BUCKET,
}: {
  admin: any;
  path?: string | null;
  bucket?: string;
}) {
  if (!path) return "";

  const { data } = admin.storage.from(bucket).getPublicUrl(path);

  return data?.publicUrl || "";
}
