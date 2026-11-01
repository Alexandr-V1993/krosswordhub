import type { Metadata } from "next";
import { SITE_NAME } from "./site";

type Opts = {
  title: string;
  description: string;
  /** Путь страницы, например "/catalog" — для canonical и og:url */
  path: string;
  /** true — заголовок без добавки «| CrosswordHub» (для главной) */
  absoluteTitle?: boolean;
  /** true — не показывать страницу в поиске (личные страницы) */
  noindex?: boolean;
};

/** Собирает мета-данные страницы: title, description, canonical, Open Graph и Twitter. */
export function pageMeta(o: Opts): Metadata {
  const fullTitle = o.absoluteTitle ? o.title : `${o.title} | ${SITE_NAME}`;
  const image = [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} — кроссворды онлайн` }];
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: o.path },
    robots: o.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title: fullTitle, description: o.description, url: o.path, type: "website", locale: "ru_RU", siteName: SITE_NAME, images: image },
    twitter: { card: "summary_large_image", title: fullTitle, description: o.description, images: ["/og.png"] },
  };
}
