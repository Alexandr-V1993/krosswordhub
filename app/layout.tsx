import type { Metadata, Viewport } from "next";
import "./globals.css";
import CrosswordApp from "@/components/CrosswordApp";
import Metrika from "@/components/Metrika";
import Ads from "@/components/Ads";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const FONTS = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CrosswordHub — кроссворды онлайн", template: `%s | ${SITE_NAME}` },
  description: "Русские кроссворды онлайн: кроссворд дня, сотни готовых сеток по темам, подсказки и личный прогресс.",
  applicationName: SITE_NAME,
  keywords: ["кроссворды онлайн", "кроссворд дня", "решать кроссворды", "русские кроссворды", "кроссворды бесплатно", "головоломки"],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfaf6",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "ru",
  description: "Русские кроссворды онлайн: кроссворд дня и сотни сеток по темам.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {/* Интерфейс живёт в layout, поэтому буквы в сетке не пропадают при переходах между страницами */}
        <CrosswordApp />
        {children}
        <Metrika />
        <Ads />
        <noscript><p style={{ padding: 24, textAlign: "center" }}>Для игры в кроссворды нужен включённый JavaScript.</p></noscript>
      </body>
    </html>
  );
}
