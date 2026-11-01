import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PER_THEME, categories, getCategoryName, levelForNumber, numberedPuzzle } from "@/lib/puzzles";
import { hrefs, parseNumber, themeFromSlug, themeSlug } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  const out: { theme: string; n: string }[] = [];
  for (const c of categories) for (let n = 1; n <= PER_THEME; n++) out.push({ theme: themeSlug(c.id), n: String(n) });
  return out;
}

type Props = { params: Promise<{ theme: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme, n } = await params;
  const id = themeFromSlug(theme);
  const num = parseNumber(n);
  if (!id || num === null) return { title: "Страница не найдена", robots: { index: false } };
  const name = getCategoryName(id);
  const level = levelForNumber(num).toLowerCase();
  const p = numberedPuzzle(id, num);
  return pageMeta({
    title: `Кроссворд «${name}» № ${num} — ${level} уровень`,
    description: `Кроссворд по теме «${name}», № ${num}: ${level} уровень, ${p.words.length} слов, сетка ${p.cols}×${p.rows}. Решай онлайн бесплатно — с подсказками и сохранением прогресса на CrosswordHub.`,
    path: hrefs.puzzle(id, num),
  });
}

export default async function PuzzlePage({ params }: Props) {
  const { theme, n } = await params;
  if (!themeFromSlug(theme) || parseNumber(n) === null) notFound();
  return null;
}
