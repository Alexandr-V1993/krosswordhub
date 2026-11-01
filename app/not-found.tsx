import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страница не найдена",
  description: "Такой страницы нет. Вернись на главную и реши кроссворд дня.",
  robots: { index: false, follow: false },
};

// Содержимое «404» рисует интерфейс сайта (components/CrosswordApp.tsx), здесь только мета-данные.
export default function NotFound() {
  return null;
}
