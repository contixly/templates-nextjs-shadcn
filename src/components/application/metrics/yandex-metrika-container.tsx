"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { YandexMetrika } from "@components/application/metrics/yandex-metrika";
import { YM_COUNTER_ID } from "@lib/environment";
import { useYandexMetrika } from "@components/application/metrics/use-yandex-metrika";

interface YandexMetrikaContainerProps {
  enabled: boolean;
}

export const YandexMetrikaContainer: React.FC<YandexMetrikaContainerProps> = ({ enabled }) => {
  const pathname = usePathname();
  const search = useSearchParams();
  const counterId = YM_COUNTER_ID ? Number(YM_COUNTER_ID) : undefined;
  const metrikaId = Number.isFinite(counterId) ? counterId : undefined;
  const { hit } = useYandexMetrika(metrikaId);

  useEffect(() => {
    if (!enabled || metrikaId === undefined) return;

    hit(`${pathname}${search.size ? `?${search}` : ""}${window.location.hash}`);
  }, [enabled, hit, metrikaId, pathname, search]);

  if (!enabled || metrikaId === undefined) return null;

  return (
    <YandexMetrika
      id={metrikaId}
      initParameters={{
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        accurateTrackBounce: true,
        trackLinks: true,
        defer: true,
      }}
    />
  );
};
