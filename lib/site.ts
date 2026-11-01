export const SITE_NAME = "CrosswordHub";
export const SITE_DOMAIN = "crosswordhub.ru";
/** Публичный адрес сайта. Можно переопределить переменной NEXT_PUBLIC_SITE_URL (например для тестового стенда). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://crosswordhub.ru").replace(/\/+$/, "");
export const SITE_TAGLINE = "кроссворды онлайн";
