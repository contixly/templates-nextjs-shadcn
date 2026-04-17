"use client";

import {
  YandexMetrikaHitOptions,
  YandexMetrikaMethod,
} from "@components/application/metrics/yandex-metrica-types";
import { isProduction } from "better-auth";
import { useCallback, useMemo } from "react";

declare const ym: (id: number, method: YandexMetrikaMethod, ...params: unknown[]) => void;

const enabled = isProduction;

export const useYandexMetrika = (id?: number) => {
  const hit = useCallback(
    (url?: string, options?: YandexMetrikaHitOptions) => {
      if (enabled && id !== undefined) {
        ym(id, "hit", url, options);
      } else {
        console.log(`%c[YandexMetrika](hit)`, `color: orange`, url);
      }
    },
    [id]
  );

  const reachGoal = useCallback(
    (target: string, params?: unknown, callback?: () => void, ctx?: unknown) => {
      if (enabled && id !== undefined) {
        ym(id, "reachGoal", target, params, callback, ctx);
      } else {
        console.log(`%c[YandexMetrika](reachGoal)`, `color: orange`, target);
      }
    },
    [id]
  );

  return useMemo(() => ({ hit, reachGoal }), [hit, reachGoal]);
};
