"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { METRIKA_ID, hit } from "@/lib/metrika";

// Счётчик подключается только на боевом сайте, чтобы разработка не портила статистику.
const ENABLED = process.env.NODE_ENV === "production";

const INIT = `
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}', 'ym');

ym(${METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

export default function Metrika() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  // Сайт переключает страницы без перезагрузки, поэтому каждый переход отправляем в Метрику вручную
  useEffect(() => {
    const url = window.location.origin + pathname;
    if (prev.current === null) { prev.current = url; return; } // первый просмотр отправляет сам счётчик (init)
    if (prev.current === url) return;
    const referrer = prev.current;
    prev.current = url;
    // небольшая пауза: Next успевает обновить <title>; таймер не отменяем, чтобы быстрые переходы не терялись
    setTimeout(() => hit(url, document.title, referrer), 120);
  }, [pathname]);

  if (!ENABLED) return null;
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: INIT }} />
      <noscript>
        <div><img src={`https://mc.yandex.ru/watch/${METRIKA_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" /></div>
      </noscript>
    </>
  );
}
