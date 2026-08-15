import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap() {
  return [
    {
      url: SITE.siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];
}
