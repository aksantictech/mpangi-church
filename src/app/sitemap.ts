import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/pricing"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("churches")
      .select("slug, created_at")
      .eq("status", "active")
      .eq("public_enabled", true)
      .not("slug", "is", null)
      .order("created_at", { ascending: false });

    if (error) return staticEntries;

    return [
      ...staticEntries,
      ...(data ?? []).map((church) => ({
        url: absoluteUrl(`/church/${church.slug}`),
        lastModified: church.created_at || undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
