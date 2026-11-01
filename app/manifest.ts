import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrosswordHub — кроссворды онлайн",
    short_name: "CrosswordHub",
    description: "Русские кроссворды онлайн: кроссворд дня и сотни сеток по темам.",
    start_url: "/",
    display: "standalone",
    lang: "ru",
    background_color: "#fbfaf6",
    theme_color: "#416b50",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
