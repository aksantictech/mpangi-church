export function extractYouTubeVideoId(input: string) {
  const value = String(input || "").trim();

  if (!value) return "";

  const plainIdMatch = value.match(/^[a-zA-Z0-9_-]{11}$/);
  if (plainIdMatch) return value;

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").slice(0, 11);
    }

    if (url.searchParams.get("v")) {
      return String(url.searchParams.get("v")).slice(0, 11);
    }

    const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch?.[1]) return shortsMatch[1];

    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch?.[1]) return embedMatch[1];
  } catch {
    const regex =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = value.match(regex);
    if (match?.[1]) return match[1];
  }

  return "";
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
