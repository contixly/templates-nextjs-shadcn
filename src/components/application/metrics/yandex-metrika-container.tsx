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
  const { hit } = useYandexMetrika(YM_COUNTER_ID);

  useEffect(() => {
    hit(`${pathname}${search.size ? `?${search}` : ""}${window.location.hash}`);
  }, [hit, pathname, search]);

  if (!enabled) return null;

  return (
    <YandexMetrika
      id={YM_COUNTER_ID}
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
