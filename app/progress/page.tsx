import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Мой прогресс — решённые кроссворды и серия дней",
  description: "Личная страница: сколько кроссвордов решено, серия дней подряд и прогресс по каждой теме.",
  path: "/progress",
  noindex: true,
});

export default function ProgressPage() {
  return null;
}
