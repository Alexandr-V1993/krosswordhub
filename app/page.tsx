import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "CrosswordHub — кроссворды онлайн: кроссворд дня и сотни сеток",
  description: "Решай русские кроссворды онлайн бесплатно: новый кроссворд дня, 480 готовых сеток по 8 темам, бесконечные случайные кроссворды, подсказки и личный прогресс.",
  path: "/",
  absoluteTitle: true,
});

// Сам интерфейс рисуется в app/layout.tsx и не пересоздаётся при переходах между страницами.
export default function Home() {
  return null;
}
