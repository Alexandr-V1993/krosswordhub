// Рекламные блоки Рекламной сети Яндекса (РСЯ).
// Блоки «floorAd» (плавающий снизу) и «fullscreen» (полноэкранный) Яндекс показывает сам: их место на странице не задаётся.

export const ADS_SCRIPT = "https://yandex.ru/ads/system/context.js";

export type FloatingBlock = { blockId: string; type: "floorAd" | "fullscreen"; platform: "desktop" | "touch" };

export const FLOATING_BLOCKS: FloatingBlock[] = [
  { blockId: "R-A-15294868-5", type: "floorAd", platform: "desktop" },
  { blockId: "R-A-15294868-4", type: "floorAd", platform: "touch" },
  { blockId: "R-A-15294868-3", type: "fullscreen", platform: "desktop" },
  { blockId: "R-A-15294868-2", type: "fullscreen", platform: "touch" },
];

/**
 * Блок над сеткой кроссворда. Для него нужен блок обычного формата (адаптивный баннер / «в ленте»),
 * созданный в кабинете Яндекса: Партнёрский интерфейс → РСЯ → Рекламные блоки.
 * Впишите его номер вида "R-A-15294868-1". Пока пусто, место над сеткой не занимается.
 */
export const GRID_AD_BLOCK_ID = "";

// Реклама включается только на боевом сайте, чтобы разработка не портила статистику блоков
export const ADS_ENABLED = process.env.NODE_ENV === "production";

type AdWindow = { yaContextCb?: Array<() => void> };
export const adQueue = () => {
  const w = window as unknown as AdWindow;
  return (w.yaContextCb = w.yaContextCb || []);
};
