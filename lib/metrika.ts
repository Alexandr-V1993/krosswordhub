// Яндекс Метрика. Номер счётчика можно заменить переменной NEXT_PUBLIC_METRIKA_ID.
export const METRIKA_ID = Number(process.env.NEXT_PUBLIC_METRIKA_ID || 113971010);

type Ym = (id: number, method: string, ...args: unknown[]) => void;

function ym(): Ym | null {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { ym?: Ym }).ym;
  return typeof f === "function" ? f : null;
}

/** Просмотр страницы при переходе внутри сайта (первый просмотр отправляет сам счётчик) */
export function hit(url: string, title: string, referrer: string) {
  try { ym()?.(METRIKA_ID, "hit", url, { title, referrer }); } catch {}
}

/**
 * Цель (достижение). Чтобы цель появилась в отчётах, создай в Метрике
 * «JavaScript-событие» с таким же идентификатором: puzzle_solved, register, login.
 */
export function reach(goal: "puzzle_solved" | "register" | "login", params?: Record<string, string | number | boolean>) {
  try { ym()?.(METRIKA_ID, "reachGoal", goal, params); } catch {}
}
