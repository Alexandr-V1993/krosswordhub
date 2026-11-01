import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PER_THEME, categories, getCategoryName } from "@/lib/puzzles";
import { hrefs, themeFromSlug, themeSlug } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map(c => ({ theme: themeSlug(c.id) }));
}

type Props = { params: Promise<{ theme: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme } = await params;
  const id = themeFromSlug(theme);
  if (!id) return { title: "Страница не найдена", robots: { index: false } };
  const name = getCategoryName(id);
  const about = categories.find(c => c.id === id)?.description ?? "";
  return pageMeta({
    title: `Кроссворды на тему «${name}» — ${PER_THEME} сеток онлайн`,
    description: `${PER_THEME} кроссвордов на тему «${name}»: ${about.toLowerCase()}. Лёгкие, средние и сложные сетки — решай онлайн бесплатно, с подсказками.`,
    path: hrefs.theme(id),
  });
}

export default async function ThemePage({ params }: Props) {
  const { theme } = await params;
  if (!themeFromSlug(theme)) notFound();
  return null;
}
