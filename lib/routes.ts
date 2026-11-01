import { PER_THEME, type ThemeId } from "./puzzles";

// Адреса тем в URL: /catalog/nature, /catalog/mix …
const SLUG: Record<ThemeId, string> = {
  all: "mix", nature: "nature", travel: "travel", culture: "culture",
  food: "food", science: "science", everyday: "everyday", sport: "sport",
};

export const themeSlug = (id: ThemeId) => SLUG[id];
export const themeFromSlug = (slug: string): ThemeId | null =>
  (Object.keys(SLUG) as ThemeId[]).find(k => SLUG[k] === slug) ?? null;

/** Номер кроссворда из URL: только «5», без «05» и «+5», чтобы у страницы был один адрес */
export function parseNumber(s: string): number | null {
  if (!/^[1-9]\d{0,2}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= PER_THEME ? n : null;
}

export const hrefs = {
  home: "/",
  catalog: "/catalog",
  progress: "/progress",
  about: "/about",
  privacy: "/privacy",
  theme: (id: ThemeId) => `/catalog/${SLUG[id]}`,
  puzzle: (id: ThemeId, n: number) => `/catalog/${SLUG[id]}/${n}`,
};

export type Route =
  | { kind: "home" }
  | { kind: "catalog" }
  | { kind: "theme"; theme: ThemeId }
  | { kind: "play"; theme: ThemeId; n: number }
  | { kind: "progress" }
  | { kind: "about" }
  | { kind: "privacy" }
  | { kind: "unknown" };

export function parseRoute(pathname: string): Route {
  const parts = pathname.split("?")[0].split("/").filter(Boolean);
  if (parts.length === 0) return { kind: "home" };
  if (parts[0] === "about" && parts.length === 1) return { kind: "about" };
  if (parts[0] === "privacy" && parts.length === 1) return { kind: "privacy" };
  if (parts[0] === "progress" && parts.length === 1) return { kind: "progress" };
  if (parts[0] === "catalog") {
    if (parts.length === 1) return { kind: "catalog" };
    const theme = themeFromSlug(parts[1]);
    if (!theme) return { kind: "unknown" };
    if (parts.length === 2) return { kind: "theme", theme };
    const n = parts.length === 3 ? parseNumber(parts[2]) : null;
    if (n !== null) return { kind: "play", theme, n };
  }
  return { kind: "unknown" };
}
