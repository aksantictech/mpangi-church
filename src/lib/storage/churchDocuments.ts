import { randomUUID } from "crypto";

export const CHURCH_DOCUMENTS_BUCKET = "church-documents";

type UploadChurchDocumentParams = {
  admin: any;
  churchId: string;
  module: string;
  file: FormDataEntryValue | null;
};

function isUploadableFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function sanitizeFileName(fileName: string) {
  const fallback = "document";
  const normalized = (fileName || fallback)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return normalized || fallback;
}

export async function uploadChurchDocument({ admin, churchId, module, file }: UploadChurchDocumentParams) {
  if (!isUploadableFile(file)) return null;
  const safeFileName = sanitizeFileName(file.name);
  const today = new Date().toISOString().slice(0, 10);
  const path = `${churchId}/${module}/${today}/${randomUUID()}-${safeFileName}`;
  const { data, error } = await admin.storage
    .from(CHURCH_DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw new Error(error.message);
  return { path: data.path, name: file.name, mimeType: file.type || null, size: file.size };
}

export function getDocumentDownloadHref({ path, filename }: { path: string; filename?: string | null }) {
  const params = new URLSearchParams();
  params.set("path", path);
  if (filename) params.set("filename", filename);
  return `/api/documents/download?${params.toString()}`;
}
