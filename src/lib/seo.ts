export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mpangi-church.app"
).replace(/\/$/, "");

export function absoluteUrl(pathname = "/") {
  const normalizedPath = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  return `${SITE_URL}${normalizedPath}`;
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
