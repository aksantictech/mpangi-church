import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/church/"],
      disallow: [
        "/account/",
        "/administration/",
        "/api/",
        "/dashboard/",
        "/dev/",
        "/finance/",
        "/login",
        "/members/",
        "/profile/",
        "/reports/",
        "/settings/",
        "/super-admin/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
