import { PER_THEME, categories } from "@/lib/puzzles";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Каталог кроссвордов — сетки по темам",
  description: `Каталог кроссвордов онлайн: ${categories.length} тем — природа, география, культура, еда, наука, быт, спорт и микс. В каждой теме ${PER_THEME} готовых сеток трёх уровней сложности.`,
  path: "/catalog",
});

export default function CatalogPage() {
  return null;
}
