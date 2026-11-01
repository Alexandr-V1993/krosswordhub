import type { MetadataRoute } from "next";
import { PER_THEME, categories } from "@/lib/puzzles";
import { hrefs } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const abs = (path: string) => (path === "/" ? SITE_URL : SITE_URL + path);
  const list: MetadataRoute.Sitemap = [
    { url: abs(hrefs.home), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: abs(hrefs.catalog), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
  for (const c of categories) {
    list.push({ url: abs(hrefs.theme(c.id)), lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    for (let n = 1; n <= PER_THEME; n++) {
      list.push({ url: abs(hrefs.puzzle(c.id, n)), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  list.push({ url: abs(hrefs.about), lastModified: now, changeFrequency: "monthly", priority: 0.3 });
  list.push({ url: abs(hrefs.privacy), lastModified: now, changeFrequency: "yearly", priority: 0.2 });
  return list;
}
