"use client";

import { useEffect } from "react";
import Script from "next/script";
import { ADS_ENABLED, ADS_SCRIPT, FLOATING_BLOCKS, GRID_AD_BLOCK_ID, adQueue } from "@/lib/ads";

type Ya = { Context: { AdvManager: { render: (o: Record<string, string>) => void } } };
const ya = () => (window as unknown as { Ya: Ya }).Ya;

let floatingDone = false;

/** Загрузчик рекламы Яндекса и плавающие блоки (floorAd, fullscreen). Подключается один раз в layout. */
export default function Ads() {
  useEffect(() => {
    if (!ADS_ENABLED || floatingDone) return;
    floatingDone = true; // один раз за заход, а не при каждом переходе между страницами
    for (const b of FLOATING_BLOCKS) {
      adQueue().push(() => { try { ya().Context.AdvManager.render({ ...b }); } catch {} });
    }
  }, []);

  if (!ADS_ENABLED) return null;
  return <Script id="yandex-ads" src={ADS_SCRIPT} strategy="afterInteractive" async />;
}

/** Рекламный блок над сеткой кроссворда */
export function GridAd() {
  useEffect(() => {
    if (!ADS_ENABLED || !GRID_AD_BLOCK_ID) return;
    adQueue().push(() => { try { ya().Context.AdvManager.render({ blockId: GRID_AD_BLOCK_ID, renderTo: `yandex_rtb_${GRID_AD_BLOCK_ID}` }); } catch {} });
  }, []);

  if (!ADS_ENABLED || !GRID_AD_BLOCK_ID) return null;
  return <div className="grid-ad" aria-label="Реклама"><div id={`yandex_rtb_${GRID_AD_BLOCK_ID}`} /></div>;
}
